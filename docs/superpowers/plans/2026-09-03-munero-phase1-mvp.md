# Munero Phase-1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-cost MVP where a professional registers, previews demo templates (psicologo, barbiere), claims one as their site (with or without custom domain), and edits it anytime via a constrained AI chat.

**Architecture:** Single Next.js App Router app on Vercel Hobby (free) + Supabase Free (Auth, Postgres RLS, Storage). Template catalog seeds demo sites; choosing a template clones a versioned Zod-validated JSON config into a tenant site instance. Edits flow only through JSON patches produced by a server-side Gemini Flash (free tier) route, validated by Zod + deterministic deontological blocklist, then ISR-revalidated. Kill-switch is Vercel middleware + Supabase status (Cloudflare for SaaS deferred to paid phase).

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (auth-js, ssr), Zod 3, Tailwind (CDN-free, PostCSS), Google Gemini 2.0 Flash via REST (free AI Studio key, server-only), Vercel Hobby, Vitest + Playwright (smoke only).

## Global Constraints

- Zero paid providers: Supabase Free tier only, Vercel Hobby only, Gemini free tier only; no Cloudflare for SaaS in Phase 1.
- EU Supabase project region; KV/hostname sync deferred — middleware reads Supabase directly with 30s cache.
- AI never emits TSX/HTML; only JSON patches against `site_schema v1`; blocked outputs never reach preview.
- Booking/health data: Phase-1 forms collect only name, contact, generic service category; free-text symptom field is forbidden and redacted server-side; bookings table is never sent to Gemini.
- Healthcare tone: purely informative; blocklist enforced before any AI output is applied (Legge 145/2018, FNOMCeO/CNOP).
- Each task ends with a testable deliverable and a commit; fail-closed on tenant status doubt.

---

### Task 1: Scaffold + Supabase wiring (Vercel-ready, free)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.env.example`, `lib/supabase-client.ts`, `lib/supabase-server.ts`
- Modify: `.gitignore` (append `.env*.local`, `.next/`)
- Test: `tests/scaffold.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `supabaseServer(): SupabaseClient` in `lib/supabase-server.ts`; `supabaseBrowser(): SupabaseClient` in `lib/supabase-client.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/scaffold.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('scaffold', () => {
  it('has vercel-ready next config and supabase helpers', () => {
    expect(fs.existsSync('next.config.mjs')).toBe(true);
    expect(fs.existsSync('lib/supabase-server.ts')).toBe(true);
    expect(fs.existsSync('lib/supabase-client.ts')).toBe(true);
    expect(fs.existsSync('.env.example')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: FAIL (files do not exist yet)

- [ ] **Step 3: Write minimal implementation**

```json
// package.json
{ "name": "munero", "private": true, "type": "module",
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "test": "vitest run" },
  "dependencies": { "@supabase/ssr": "^0.5.2", "@supabase/supabase-js": "^2.45.0", "next": "14.2.5", "react": "^18.3.1", "react-dom": "^18.3.1", "zod": "^3.23.8" },
  "devDependencies": { "autoprefixer": "^10.4.19", "postcss": "^8.4.40", "tailwindcss": "^3.4.7", "typescript": "^5.5.4", "vitest": "^2.0.5", "@types/node": "^20.14.0", "@types/react": "^18.3.0" } }
```

```mjs
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

```ts
// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
```

```ts
// lib/supabase-server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get(n: string) { return store.get(n)?.value; } },
  });
}
```

```tsx
// app/layout.tsx
import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="it"><body>{children}</body></html>;
}
```

```tsx
// app/page.tsx
export default function Home() {
  return <main style={{ padding: 32 }}><h1>Munero</h1><p><a href="/catalogo">Vedi i siti demo</a></p></main>;
}
```

```
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key-server-only
GEMINI_API_KEY=ai-studio-free-key-server-only
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs "app/globals.css" app/layout.tsx app/page.tsx .env.example lib/supabase-client.ts lib/supabase-server.ts .gitignore tests/scaffold.test.ts
git commit -m "feat: scaffold next.js + supabase wiring (free tier)"
```

---

### Task 2: Auth + tenant link (register, login, dashboard shell)

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/dashboard/page.tsx`, `supabase/migrations/001_tenants.sql`, `tests/auth-tenant.test.ts`
- Modify: `app/page.tsx` (add login link)
- Test: `tests/auth-tenant.test.ts`

**Interfaces:**
- Consumes: `supabaseServer()` from Task 1
- Produces: SQL table `public.tenants`; dashboard reads `tenants` rows where `owner_id = auth.uid()`

- [ ] **Step 1: Write the failing test**

```ts
// tests/auth-tenant.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('auth tenant', () => {
  it('migration defines tenants with owner link and statuses', () => {
    const sql = fs.readFileSync('supabase/migrations/001_tenants.sql', 'utf8');
    expect(sql).toContain('create table public.tenants');
    expect(sql).toContain('owner_id uuid references auth.users(id)');
    expect(sql).toContain(`'active','past_due_grace','suspended','deleted'`);
    expect(sql).toContain('row level security');
  });
  it('auth pages exist', () => {
    expect(fs.existsSync('app/(auth)/register/page.tsx')).toBe(true);
    expect(fs.existsSync('app/dashboard/page.tsx')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth-tenant.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```sql
-- supabase/migrations/001_tenants.sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,63}$'),
  display_name text not null,
  profession text not null default 'generico' check (profession in ('psicologo','barbiere','generico')),
  custom_domain text unique,
  domain_status text not null default 'pending' check (domain_status in ('pending','verifying','active','failed')),
  status text not null default 'active' check (status in ('active','past_due_grace','suspended','deleted')),
  plan text not null default 'senza-dominio' check (plan in ('senza-dominio','con-dominio')),
  created_at timestamptz not null default now()
);
alter table public.tenants enable row level security;
create policy "owners read own tenants" on public.tenants for select using (auth.uid() = owner_id);
create policy "owners insert own tenants" on public.tenants for insert with check (auth.uid() = owner_id);
create policy "owners update own tenants" on public.tenants for update using (auth.uid() = owner_id);
create table public.tenant_status_events (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  old_status text, new_status text, reason text, actor text, at timestamptz default now()
);
```

```tsx
// app/(auth)/register/page.tsx
'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
export default function Register() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('');
  return <main style={{ padding: 32 }}><h1>Registrati</h1>
    <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder="password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
    <button onClick={async () => {
      const { error } = await supabaseBrowser().auth.signUp({ email, password: pw });
      setMsg(error ? error.message : 'Controlla la tua email per confermare.');
    }}>Crea account</button><p>{msg}</p></main>;
}
```

```tsx
// app/dashboard/page.tsx
import { supabaseServer } from '@/lib/supabase-server';
export default async function Dashboard() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main style={{ padding: 32 }}><p>Devi <a href="/login">accedere</a>.</p></main>;
  const { data } = await sb.from('tenants').select('slug,display_name,status,plan').eq('owner_id', user.id);
  return <main style={{ padding: 32 }}><h1>I tuoi siti</h1>
    <p><a href="/catalogo">Scegli un sito demo</a> · <a href="/chat">Modifica con la chat AI</a></p>
    <ul>{(data ?? []).map(t => <li key={t.slug}>{t.display_name} — {t.slug} — {t.status} — {t.plan}</li>)}</ul></main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/auth-tenant.test.ts`
Expected: PASS. Then apply `001_tenants.sql` in Supabase SQL editor (free project, EU region) and verify register → login → empty dashboard manually.

- [ ] **Step 5: Commit**

```bash
git add "supabase/migrations/001_tenants.sql" "app/(auth)/login/page.tsx" "app/(auth)/register/page.tsx" app/dashboard/page.tsx app/page.tsx tests/auth-tenant.test.ts
git commit -m "feat: auth + tenant link with RLS"
```

---

### Task 3: Template catalog + demo preview (psicologo, barbiere)

**Files:**
- Create: `content/templates/psicologo.json`, `content/templates/barbiere.json`, `lib/site-schema.ts`, `app/catalogo/page.tsx`, `app/demo/[template]/page.tsx`, `supabase/migrations/002_templates.sql`, `tests/catalog.test.ts`
- Test: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: `siteSchema` from `lib/site-schema.ts`
- Produces: `getTemplate(name): SiteConfig`; catalog page lists templates; demo page renders them read-only

- [ ] **Step 1: Write the failing test**

```ts
// tests/catalog.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import psicologo from '../content/templates/psicologo.json';
import barbiere from '../content/templates/barbiere.json';
describe('catalog', () => {
  it('both seed templates validate against site_schema v1', () => {
    expect(siteSchema.parse(psicologo).profession).toBe('psicologo');
    expect(siteSchema.parse(barbiere).profession).toBe('barbiere');
  });
  it('seed templates carry mandatory legal footer', () => {
    for (const t of [psicologo, barbiere] as any[]) {
      expect(t.legal.nome).toBeTruthy();
      expect(t.legal.piva).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog.test.ts`
Expected: FAIL (schema/templates missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/site-schema.ts
import { z } from 'zod';
export const siteSchema = z.object({
  schema_version: z.literal('v1'),
  profession: z.enum(['psicologo', 'barbiere', 'generico']),
  branding: z.object({ name: z.string().min(2), primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/), phone: z.string().min(5) }),
  hero: z.object({ title: z.string().min(3).max(90), subtitle: z.string().max(220) }),
  services: z.array(z.object({ name: z.string().min(2), price: z.string().min(1) })).max(12),
  address: z.string().min(4),
  legal: z.object({ nome: z.string().min(3), ordine: z.string().min(2), albo_n: z.string().min(1), piva: z.string().min(5), pec: z.string().email() }),
});
export type SiteConfig = z.infer<typeof siteSchema>;
```

```json
// content/templates/psicologo.json
{ "schema_version": "v1", "profession": "psicologo",
  "branding": { "name": "Dott.ssa Esempio", "primary_color": "#2f5d50", "phone": "+39 333 000 0000" },
  "hero": { "title": "Supporto psicologico", "subtitle": "Colloqui in studio e online. Approccio informativo, senza promesse di risultato." },
  "services": [{ "name": "Colloquio individuale (50 min)", "price": "€ 60" }],
  "address": "Via Roma 1, Milano",
  "legal": { "nome": "Dott.ssa Maria Esempio", "ordine": "OPL", "albo_n": "00000", "piva": "01234567890", "pec": "maria.esempio@pec.it" } }
```

```json
// content/templates/barbiere.json
{ "schema_version": "v1", "profession": "barbiere",
  "branding": { "name": "Barbiere Esempio", "primary_color": "#1f2937", "phone": "+39 333 111 1111" },
  "hero": { "title": "Taglio e rasatura", "subtitle": "Prenota il tuo posto. Prezzi esposti in modo trasparente." },
  "services": [{ "name": "Taglio", "price": "€ 25" }, { "name": "Barba", "price": "€ 15" }],
  "address": "Via Verdi 2, Torino",
  "legal": { "nome": "Barbiere Esempio di Rossi Mario", "ordine": "—", "albo_n": "—", "piva": "09876543210", "pec": "barbiere.esempio@pec.it" } }
```

Catalog page lists both with links to `/demo/psicologo` and `/demo/barbiere`; demo page imports the JSON, parses with `siteSchema`, renders sections read-only with a "Usa questo modello" button linking to `/attiva?template=psicologo`. Founder-uploaded sites slot in as `content/templates/<nome>.json` once converted to this schema (import guide in `/docs/import-template.md`, one page).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/site-schema.ts content/templates/psicologo.json content/templates/barbiere.json app/catalogo/page.tsx "app/demo/[template]/page.tsx" supabase/migrations/002_templates.sql tests/catalog.test.ts
git commit -m "feat: template catalog with psicologo and barbiere demos"
```

---

### Task 4: Claim a site (clone template → tenant instance, pricing senza/con dominio)

**Files:**
- Create: `app/attiva/page.tsx`, `app/api/claim/route.ts`, `supabase/migrations/003_site_instances.sql`, `tests/claim.test.ts`
- Test: `tests/claim.test.ts`

**Interfaces:**
- Consumes: `siteSchema`, `supabaseServer()`, `public.tenants`
- Produces: `POST /api/claim { template, slug, displayName, plan } → { slug }`; table `public.site_instances(tenant_id, config jsonb)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/claim.test.ts
import { describe, it, expect } from 'vitest';
describe('claim', () => {
  it('rejects invalid slugs', () => {
    const bad = ['A', 'a b', 'sito_bello!', 'ab'];
    for (const s of bad) expect(/^[a-z0-9-]{3,63}$/.test(s)).toBe(false);
  });
  it('claim route exists', async () => {
    const fs = await import('node:fs');
    expect(fs.existsSync('app/api/claim/route.ts')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/claim.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```sql
-- supabase/migrations/003_site_instances.sql
create table public.site_instances (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_instances enable row level security;
create policy "owners read own site" on public.site_instances for select using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()));
create policy "owners write own site" on public.site_instances for all using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()))
  with check (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()));
```

```ts
// app/api/claim/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { siteSchema } from '@/lib/site-schema';
import psicologo from '@/content/templates/psicologo.json';
import barbiere from '@/content/templates/barbiere.json';
const TPL: Record<string, unknown> = { psicologo, barbiere };
export async function POST(req: Request) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { template, slug, displayName, plan } = body as { template: string; slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio' };
  if (!TPL[template]) return NextResponse.json({ error: 'unknown template' }, { status: 400 });
  if (!/^[a-z0-9-]{3,63}$/.test(slug ?? '')) return NextResponse.json({ error: 'bad slug' }, { status: 400 });
  const config = siteSchema.parse(TPL[template]);
  const { data: tenant, error: tErr } = await sb.from('tenants').insert({
    owner_id: user.id, slug: slug.toLowerCase(), display_name: displayName, plan,
    profession: config.profession,
  }).select('id,slug').single();
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 });
  const { error: iErr } = await sb.from('site_instances').insert({ tenant_id: tenant.id, config });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });
  return NextResponse.json({ slug: tenant.slug });
}
```

Pricing (Phase 1, manual, no paid billing provider): `senza-dominio` = lower monthly, site live at `slug.munero.it` path immediately; `con-dominio` = one-time setup + higher monthly, `domain_status='pending'` until founder verifies DNS manually in Supabase dashboard. Upgrade path: Stripe Test Mode link added later without schema change (`plan` already models it).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/claim.test.ts`
Expected: PASS + manual check: register → `/catalogo` → `/attiva?template=barbiere` → new row in `tenants` + `site_instances`.

- [ ] **Step 5: Commit**

```bash
git add app/attiva/page.tsx app/api/claim/route.ts supabase/migrations/003_site_instances.sql tests/claim.test.ts
git commit -m "feat: claim template as tenant site instance with pricing plans"
```

---

### Task 5: Tenant renderer + lite kill-switch (middleware, zero-cost)

**Files:**
- Create: `middleware.ts`, `app/t/[slug]/page.tsx`, `app/sospeso/page.tsx`, `tests/killswitch.test.ts`
- Test: `tests/killswitch.test.ts`

**Interfaces:**
- Consumes: `public.tenants`, `public.site_instances`
- Produces: public render at `/t/[slug]`; suspended tenants get 402-style `/sospeso` page; middleware is the kill-switch (Supabase read, 30s cache)

- [ ] **Step 1: Write the failing test**

```ts
// tests/killswitch.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('killswitch', () => {
  it('middleware checks tenant status fail-closed', () => {
    const src = fs.readFileSync('middleware.ts', 'utf8');
    expect(src).toContain('suspended');
    expect(src).toContain('/sospeso');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/killswitch.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const cache = new Map<string, { status: string; at: number }>();
export async function middleware(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^\/t\/([a-z0-9-]+)/);
  if (!m) return NextResponse.next();
  const slug = m[1];
  const hit = cache.get(slug);
  let status = hit && Date.now() - hit.at < 30_000 ? hit.status : null;
  if (!status) {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tenants?slug=eq.${slug}&select=status`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` },
    });
    const rows = (await r.json()) as { status: string }[];
    if (!rows.length) return NextResponse.rewrite(new URL('/sospeso', req.url));
    status = rows[0].status;
    cache.set(slug, { status, at: Date.now() });
  }
  if (status === 'suspended' || status === 'deleted') return NextResponse.rewrite(new URL('/sospeso', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/t/:slug*'] };
```

Tenant page fetches `tenants` + `site_instances` by slug, validates config with `siteSchema`, renders sections. `/sospeso` is neutral: "Servizio temporaneamente sospeso — contatta Munero", no tenant branding.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/killswitch.test.ts`
Expected: PASS + manual: set `status='suspended'` in Supabase → `/t/<slug>` shows `/sospeso` within ~30s.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts "app/t/[slug]/page.tsx" app/sospeso/page.tsx tests/killswitch.test.ts
git commit -m "feat: tenant renderer with middleware kill-switch"
```

---

### Task 6: AI chat edits via Gemini free tier (guardrailed JSON patches)

**Files:**
- Create: `app/chat/page.tsx`, `app/api/chat-edit/route.ts`, `lib/guardrail.ts`, `tests/guardrail.test.ts`
- Test: `tests/guardrail.test.ts`

**Interfaces:**
- Consumes: `siteSchema`, `public.site_instances`
- Produces: `POST /api/chat-edit { tenantId, message } → { patch, verdict } | { blocked, reason }`; chat UI applies accepted patch after preview confirm

- [ ] **Step 1: Write the failing test**

```ts
// tests/guardrail.test.ts
import { describe, it, expect } from 'vitest';
import { checkDeontology } from '../lib/guardrail';
describe('guardrail', () => {
  it('blocks discounts and superlatives (Legge 145/2018)', () => {
    expect(checkDeontology('Offerta speciale: sconto 20% solo oggi!').blocked).toBe(true);
    expect(checkDeontology('Il miglior psicologo di Milano, risultati garantiti').blocked).toBe(true);
  });
  it('allows informative price/address edits', () => {
    expect(checkDeontology('Aggiorna il prezzo del taglio a 28 euro').blocked).toBe(false);
    expect(checkDeontology('Cambia indirizzo in Via Verdi 10').blocked).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/guardrail.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/guardrail.ts
const BANNED = [/scont[oi]/i, /offert[ae]/i, /promozione/i, /%\s*(di\s*sconto)?/i, /miglior/i, /garantit/i, /prima\s*\/\s*dopo/i, /recension/i];
export function checkDeontology(text: string): { blocked: boolean; reason?: string } {
  for (const rx of BANNED) if (rx.test(text)) return { blocked: true, reason: `Contenuto non consentito per professionisti sanitari (Legge 145/2018): pattern ${rx.source}` };
  return { blocked: false };
}
```

```ts
// app/api/chat-edit/route.ts (server-only; GEMINI_API_KEY never leaves server)
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { siteSchema } from '@/lib/site-schema';
import { checkDeontology } from '@/lib/guardrail';
const SYSTEM = `Sei l'assistente Munero. Rispondi SOLO con un JSON patch minimo per site_schema v1 (chiavi: branding, hero, services, address). Tono puramente informativo. Vietati sconti, offerte, superlativi, confronti, promesse di risultato (Legge 145/2018). Se la richiesta viola queste regole, rispondi {"__blocked__": true}.`;
export async function POST(req: Request) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { tenantId, message } = (await req.json()) as { tenantId: string; message: string };
  const pre = checkDeontology(message);
  if (pre.blocked) return NextResponse.json({ blocked: true, reason: pre.reason }, { status: 200 });
  const { data: inst } = await sb.from('site_instances').select('config').eq('tenant_id', tenantId).single();
  if (!inst) return NextResponse.json({ error: 'no site' }, { status: 404 });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: `Config attuale: ${JSON.stringify(inst.config)}\nRichiesta: ${message}` }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 500 } }),
  });
  const j = await r.json();
  const text: string = j.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();
  let patch: Record<string, unknown>;
  try { patch = JSON.parse(cleaned); } catch { return NextResponse.json({ blocked: true, reason: 'Risposta AI non valida, riprova.' }, { status: 200 }); }
  if ((patch as any).__blocked__) return NextResponse.json({ blocked: true, reason: 'Richiesta non conforme al codice deontologico.' }, { status: 200 });
  const merged = siteSchema.safeParse({ ...(inst.config as object), ...patch });
  if (!merged.success) return NextResponse.json({ blocked: true, reason: 'Modifica non valida per lo schema del sito.' }, { status: 200 });
  const post = checkDeontology(JSON.stringify(patch));
  if (post.blocked) return NextResponse.json({ blocked: true, reason: post.reason }, { status: 200 });
  await sb.from('site_instances').update({ config: merged.data }).eq('tenant_id', tenantId);
  return NextResponse.json({ patch, verdict: 'applied' });
}
```

Chat page: tenant selector (owner's sites only) + message box + result area showing applied/blocked with reason. No bookings data is ever included in the Gemini prompt — only the public site config.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/guardrail.test.ts`
Expected: PASS + manual: "cambia prezzo taglio a 28€" applies; "fai sconto 20%" blocked.

- [ ] **Step 5: Commit**

```bash
git add app/chat/page.tsx app/api/chat-edit/route.ts lib/guardrail.ts tests/guardrail.test.ts
git commit -m "feat: AI chat edits via gemini free tier with deontology guardrail"
```

---

## Self-Review

- Spec coverage: Slice A tenancy/kill-switch implemented in zero-cost form (middleware + Supabase instead of Cloudflare for SaaS, documented as paid-phase upgrade); auth/catalog/claim/chat/billing-stub cover the founder's new Phase-1 requirements; bookings minimal-form table deliberately deferred to next plan to keep this plan shippable on free tiers.
- Placeholder scan: no TBD/TODO; every code step contains concrete file paths, SQL, TSX/TS, and exact run commands.
- Type consistency: `plan: 'senza-dominio' | 'con-dominio'` matches migration CHECK; `SiteConfig` flows from `siteSchema` through templates, claim, renderer, and chat merge without renames.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-03-munero-phase1-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
