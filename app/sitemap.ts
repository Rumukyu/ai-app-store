import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = 'https://appstore-sage.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: apps } = await supabase
    .from('apps')
    .select('id, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/apps`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const appRoutes: MetadataRoute.Sitemap = (apps ?? []).map(app => ({
    url: `${siteUrl}/apps/${app.id}`,
    lastModified: new Date(app.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map(p => ({
    url: `${siteUrl}/profile/${p.username}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...appRoutes, ...profileRoutes];
}
