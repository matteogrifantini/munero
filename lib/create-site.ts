import type { SiteConfig } from './site-schema';
type Sb = ReturnType<typeof import('./supabase-server').supabaseServer> extends Promise<infer T> ? T : never;
export async function provisionSite(
  sb: Sb,
  userId: string,
  input: { slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio'; config: SiteConfig },
): Promise<{ slug: string }> {
  const slug = String(input.slug ?? '').trim().toLowerCase();
  if (!/^[a-z0-9-]{3,63}$/.test(slug)) throw new Error('bad slug');
  const { data: tenant, error: tErr } = await sb.from('tenants').insert({
    owner_id: userId, slug, display_name: input.displayName, plan: input.plan,
    profession: input.config.profession,
  }).select('id,slug').single();
  if (tErr || !tenant) throw new Error(tErr?.message ?? 'tenant insert failed');
  const { error: iErr } = await sb.from('site_instances').insert({ tenant_id: tenant.id, config: input.config });
  if (iErr) throw new Error(iErr.message);
  return { slug: tenant.slug as string };
}
