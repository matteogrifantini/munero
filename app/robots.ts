import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://munero.it').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/catalogo', '/demo/', '/t/', '/wizard'],
        disallow: ['/api/', '/dashboard', '/chat', '/attiva', '/login', '/register'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
