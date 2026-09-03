import { redirect } from 'next/navigation';
import { siteSchema } from '@/lib/site-schema';

export const dynamic = 'force-dynamic';

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

export default async function TenantPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!/^[a-z0-9-]{3,63}$/.test(slug)) redirect('/sospeso');

  const tenants = await fetchRows<{ id: string; status: string }>(
    `tenants?slug=eq.${slug}&select=id,status`,
  );
  if (!tenants || tenants.length !== 1) redirect('/sospeso');
  const tenant = tenants[0];
  if (tenant.status === 'suspended' || tenant.status === 'deleted') redirect('/sospeso');
  if (tenant.status !== 'active' && tenant.status !== 'past_due_grace') redirect('/sospeso');

  const instances = await fetchRows<{ config: unknown }>(
    `site_instances?tenant_id=eq.${tenant.id}&select=config`,
  );
  if (!instances || instances.length !== 1) redirect('/sospeso');
  const parsed = siteSchema.safeParse(instances[0].config);
  if (!parsed.success) redirect('/sospeso');
  const site = parsed.data;

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ color: site.branding.primary_color }}>{site.hero.title}</h1>
      <p>{site.hero.subtitle}</p>
      <p>{site.branding.name} · {site.branding.phone}</p>
      <h2>Servizi</h2>
      <ul>
        {site.services.map((s) => (
          <li key={s.name}>{s.name} — {s.price}</li>
        ))}
      </ul>
      <p>{site.address}</p>
      <footer>
        {site.legal.nome} · P.IVA {site.legal.piva} · {site.legal.pec}
      </footer>
    </main>
  );
}
