// app/api/chat-edit/route.ts (server-only; GEMINI_API_KEY never leaves server)
// Order: guardrail → fast path (0 tokens) → Gemini fallback (minimal tokens)
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { siteSchema } from '@/lib/site-schema';
import { checkDeontology } from '@/lib/guardrail';
import { tryFastEdit } from '@/lib/fast-edit';
const SYSTEM = `Sei l'assistente Munero. Rispondi SOLO con un JSON patch minimo per site_schema v1 (chiavi: branding, hero, services, address). Tono puramente informativo. Vietati sconti, offerte, superlativi, confronti, promesse di risultato (Legge 145/2018). Se la richiesta viola queste regole, rispondi {"__blocked__": true}.`;
export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { tenantId, message } = (await req.json()) as { tenantId: string; message: string };
  const pre = checkDeontology(message);
  if (pre.blocked) return NextResponse.json({ blocked: true, reason: pre.reason }, { status: 200 });
  const { data: owner } = await sb.from('tenants').select('id').eq('id', tenantId).eq('owner_id', user.id).single();
  if (!owner) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { data: inst } = await sb.from('site_instances').select('config').eq('tenant_id', tenantId).single();
  if (!inst) return NextResponse.json({ error: 'no site' }, { status: 404 });
  const current = inst.config as Parameters<typeof tryFastEdit>[0];
  // Fast path first: zero tokens for common edits
  const fast = tryFastEdit(current, message);
  let patch: Record<string, unknown>;
  let via: 'fast' | 'gemini' = 'fast';
  if (fast.matched) {
    patch = fast.patch!;
  } else {
    via = 'gemini';
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: `Config attuale: ${JSON.stringify(inst.config)}\nRichiesta: ${message}` }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 500 } }),
      });
      const j = await r.json();
      const text: string = j.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      const cleaned = text.replace(/```json|```/g, '').trim();
      try { patch = JSON.parse(cleaned); } catch { return NextResponse.json({ blocked: true, reason: 'Risposta AI non valida, riprova.' }, { status: 200 }); }
    } catch {
      return NextResponse.json({ blocked: true, reason: 'AI non disponibile, riprova.' }, { status: 200 });
    }
  }
  if ((patch as any).__blocked__) return NextResponse.json({ blocked: true, reason: 'Richiesta non conforme al codice deontologico.' }, { status: 200 });
  const merged = siteSchema.safeParse({ ...(inst.config as object), ...patch });
  if (!merged.success) return NextResponse.json({ blocked: true, reason: 'Modifica non valida per lo schema del sito.' }, { status: 200 });
  const post = checkDeontology(JSON.stringify(patch));
  if (post.blocked) return NextResponse.json({ blocked: true, reason: post.reason }, { status: 200 });
  await sb.from('site_instances').update({ config: merged.data }).eq('tenant_id', tenantId);
  return NextResponse.json({ patch, verdict: 'applied', via });
}
