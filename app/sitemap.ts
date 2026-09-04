import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://munero.it').replace(/\/$/, '');

async function activeSlugs(): Promise<string[]> {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tenants?select=slug&status=in.(active,past_due_grace)&limit=1000`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    );
    if (!r.ok) return [];
    const rows = (await r.json()) as { slug: string }[];
    return rows.map((t) => t.slug).filter((s) => /^[a-z0-9-]{3,63}$/.test(s));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = ['/', '/catalogo', '/wizard', '/demo/psicologo', '/demo/barbiere'].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
  }));
  const tenants = (await activeSlugs()).map((slug) => ({
    url: `${BASE}/t/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
  }));
  return [...staticPages, ...tenants];
}
