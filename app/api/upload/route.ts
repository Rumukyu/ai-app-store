import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { uploadToStorage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(request: Request) {
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

  const formData = await request.formData();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const longDescription = formData.get('long_description') as string | null;
  const category = formData.get('category') as string;
  const tags = JSON.parse(formData.get('tags') as string ?? '[]') as string[];
  const aiTools = JSON.parse(formData.get('ai_tools') as string ?? '[]') as string[];
  const webUrl = formData.get('web_url') as string | null;
  const githubUrl = formData.get('github_url') as string | null;
  const version = (formData.get('version') as string) || '1.0.0';
  const thumbnailFile = formData.get('thumbnail') as File | null;
  const appFile = formData.get('file') as File | null;

  if (!title || !description || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let thumbnailUrl: string | null = null;
  let fileUrl: string | null = null;
  let fileSize: number | null = null;
  let fileName: string | null = null;

  // ファイル名から拡張子だけ取り出し、日本語・スペース等を含まない安全なキーを生成
  const safeExt = (name: string) => {
    const m = name.match(/\.([^.]+)$/);
    return m ? `.${m[1].toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  };

  try {
    // サムネイルアップロード
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbnailKey = `${user.id}/${uuidv4()}${safeExt(thumbnailFile.name)}`;
      thumbnailUrl = await uploadToStorage(thumbnailBuffer, 'thumbnails', thumbnailKey, thumbnailFile.type);
    }

    // アプリファイルアップロード
    if (appFile && appFile.size > 0) {
      const fileBuffer = Buffer.from(await appFile.arrayBuffer());
      const fileKey = `${user.id}/${uuidv4()}${safeExt(appFile.name)}`;
      fileUrl = await uploadToStorage(fileBuffer, 'apps', fileKey, appFile.type);
      fileSize = appFile.size;
      fileName = appFile.name;
    }

    // データベースに挿入
    const { data: app, error } = await supabase
      .from('apps')
      .insert({
        user_id: user.id,
        title,
        description,
        long_description: longDescription || null,
        category,
        tags: tags.length > 0 ? tags : null,
        ai_tools: aiTools.length > 0 ? aiTools : null,
        thumbnail_url: thumbnailUrl,
        file_url: fileUrl,
        file_size: fileSize,
        file_name: fileName,
        web_url: webUrl || null,
        github_url: githubUrl || null,
        version,
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ app });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
