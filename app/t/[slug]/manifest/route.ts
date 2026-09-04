import { NextResponse } from 'next/server';
import { loadTenantSite } from '@/lib/tenant-site';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadTenantSite(slug);
  if (!loaded) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { site } = loaded;
  return NextResponse.json(
    {
      name: site.branding.name,
      short_name: site.branding.name.slice(0, 12),
      start_url: `/t/${slug}`,
      scope: `/t/${slug}`,
      display: 'standalone',
      background_color: '#faf8f4',
      theme_color: site.branding.primary_color,
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } },
  );
}
