import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase-server';
import { siteSchema } from '@/lib/site-schema';
import { provisionSite } from '@/lib/create-site';
const planSchema = z.enum(['senza-dominio', 'con-dominio']);
const displayNameSchema = z.string().min(1).max(120);
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { slug, displayName, plan, config } = body as { slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio'; config: unknown };
  if (!displayNameSchema.safeParse(displayName).success) return NextResponse.json({ error: 'bad displayName' }, { status: 400 });
  if (!planSchema.safeParse(plan).success) return NextResponse.json({ error: 'bad plan' }, { status: 400 });
  const parsed = siteSchema.safeParse(config);
  if (!parsed.success) return NextResponse.json({ error: 'bad config' }, { status: 400 });
  try {
    const { slug: out } = await provisionSite(sb, user.id, { slug, displayName, plan, config: parsed.data });
    return NextResponse.json({ slug: out });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'provision failed' }, { status: 400 });
  }
}
