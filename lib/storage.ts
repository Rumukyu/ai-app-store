import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadToStorage(
  file: Buffer | Uint8Array,
  bucket: 'thumbnails' | 'apps',
  path: string,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
