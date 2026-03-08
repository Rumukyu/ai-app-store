import type { MetadataRoute } from 'next';

const siteUrl = 'https://appstore-sage.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/apps/upload', '/profile/settings'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
