import { siteSchema, type SiteConfig } from './site-schema';

async function fetchRows<T>(path: string): Promise<T[] | null> {
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return (await r.json()) as T[];
  } catch {
    return null;
  }
}

export type TenantSite = { tenantId: string; slug: string; site: SiteConfig };

// Returns null for unknown slugs, non-active tenants, missing instances, invalid configs.
// Callers fail closed (redirect /sospeso, 404, or empty metadata).
export async function loadTenantSite(slug: string): Promise<TenantSite | null> {
  if (!/^[a-z0-9-]{3,63}$/.test(slug)) return null;
  const tenants = await fetchRows<{ id: string; status: string }>(
    `tenants?slug=eq.${slug}&select=id,status`,
  );
  if (!tenants || tenants.length !== 1) return null;
  const tenant = tenants[0];
  if (tenant.status !== 'active' && tenant.status !== 'past_due_grace') return null;
  const instances = await fetchRows<{ config: unknown }>(
    `site_instances?tenant_id=eq.${tenant.id}&select=config`,
  );
  if (!instances || instances.length !== 1) return null;
  const parsed = siteSchema.safeParse(instances[0].config);
  if (!parsed.success) return null;
  return { tenantId: tenant.id, slug, site: parsed.data };
}
