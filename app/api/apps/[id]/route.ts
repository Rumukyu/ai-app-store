import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-server';
import { uploadToStorage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

const safeExt = (name: string) => {
  const m = name.match(/\.([^.]+)$/);
  return m ? `.${m[1].toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
};

const extractPath = (url: string | null, bucket: string) => {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: existing, error: fetchError } = await service
    .from('apps')
    .select('id, user_id, thumbnail_url, file_url')
    .eq('id', id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: 'App not found' }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await request.formData();

  const updates: Record<string, unknown> = {};
  const fields = ['title', 'description', 'long_description', 'category', 'version', 'web_url', 'github_url'];
  for (const f of fields) {
    const v = formData.get(f);
    if (v !== null) updates[f] = v as string;
  }
  const tagsRaw = formData.get('tags');
  if (tagsRaw) updates.tags = JSON.parse(tagsRaw as string);
  const aiToolsRaw = formData.get('ai_tools');
  if (aiToolsRaw) updates.ai_tools = JSON.parse(aiToolsRaw as string);

  // サムネイル差し替え
  const thumbnailFile = formData.get('thumbnail') as File | null;
  if (thumbnailFile && thumbnailFile.size > 0) {
    const oldPath = extractPath(existing.thumbnail_url, 'thumbnails');
    if (oldPath) await service.storage.from('thumbnails').remove([oldPath]);
    const key = `${user.id}/${uuidv4()}${safeExt(thumbnailFile.name)}`;
    const buf = Buffer.from(await thumbnailFile.arrayBuffer());
    updates.thumbnail_url = await uploadToStorage(buf, 'thumbnails', key, thumbnailFile.type);
  }

  // アプリファイル差し替え
  const appFile = formData.get('file') as File | null;
  if (appFile && appFile.size > 0) {
    const oldPath = extractPath(existing.file_url, 'apps');
    if (oldPath) await service.storage.from('apps').remove([oldPath]);
    const key = `${user.id}/${uuidv4()}${safeExt(appFile.name)}`;
    const buf = Buffer.from(await appFile.arrayBuffer());
    updates.file_url = await uploadToStorage(buf, 'apps', key, appFile.type);
    updates.file_size = appFile.size;
    updates.file_name = appFile.name;
  }

  const { data: updated, error: updateError } = await service
    .from('apps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ app: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // アプリ情報を取得（所有者確認 + ファイルURL取得）
  const service = createServiceClient();
  const { data: app, error } = await service
    .from('apps')
    .select('id, user_id, thumbnail_url, file_url')
    .eq('id', id)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  if (app.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Storageからファイルを削除
  const extractPath = (url: string | null, bucket: string) => {
    if (!url) return null;
    const marker = `/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    return idx !== -1 ? url.slice(idx + marker.length) : null;
  };

  const thumbnailPath = extractPath(app.thumbnail_url, 'thumbnails');
  const filePath = extractPath(app.file_url, 'apps');

  if (thumbnailPath) {
    await service.storage.from('thumbnails').remove([thumbnailPath]);
  }
  if (filePath) {
    await service.storage.from('apps').remove([filePath]);
  }

  // DBから削除（likesとcommentsはCASCADE削除）
  const { error: deleteError } = await service
    .from('apps')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
