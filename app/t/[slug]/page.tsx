import { redirect } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import SiteView from '@/components/SiteView';
import { loadTenantSite } from '@/lib/tenant-site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadTenantSite(slug);
  if (!loaded) return {};
  return {
    title: loaded.site.branding.name,
    manifest: `/t/${slug}/manifest`,
  };
}

export async function generateViewport({ params }: { params: Promise<{ slug: string }> }): Promise<Viewport> {
  const { slug } = await params;
  const loaded = await loadTenantSite(slug);
  return { themeColor: loaded?.site.branding.primary_color ?? '#1e3d2b' };
}

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadTenantSite(slug);
  if (!loaded) redirect('/sospeso');
  return <SiteView site={loaded.site} />;
}
