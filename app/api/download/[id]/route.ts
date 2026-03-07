import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: app, error } = await supabase
    .from('apps')
    .select('file_url, web_url, download_count')
    .eq('id', id)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  // ダウンロード数インクリメント
  await supabase
    .from('apps')
    .update({ download_count: app.download_count + 1 })
    .eq('id', id);

  const url = app.file_url ?? app.web_url;
  if (!url) {
    return NextResponse.json({ error: 'No file available' }, { status: 404 });
  }

  return NextResponse.redirect(url);
}
