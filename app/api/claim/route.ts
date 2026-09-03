import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { siteSchema } from '@/lib/site-schema';
import { getTemplate, templateNames } from '@/lib/templates';

const TPL: Record<string, boolean> = Object.fromEntries(templateNames.map((n) => [n, true]));

export async function POST(req: Request) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { template, slug, displayName, plan } = body as { template: string; slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio' };
  if (!TPL[template]) return NextResponse.json({ error: 'unknown template' }, { status: 400 });
  if (!/^[a-z0-9-]{3,63}$/.test(slug ?? '')) return NextResponse.json({ error: 'bad slug' }, { status: 400 });
  const config = siteSchema.parse(getTemplate(template));
  const { data: tenant, error: tErr } = await sb.from('tenants').insert({
    owner_id: user.id, slug: slug.toLowerCase(), display_name: displayName, plan,
    profession: config.profession,
  }).select('id,slug').single();
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 });
  const { error: iErr } = await sb.from('site_instances').insert({ tenant_id: tenant.id, config });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });
  return NextResponse.json({ slug: tenant.slug });
}
