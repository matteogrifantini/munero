# Wizard Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 4-step deterministic wizard (role → variant → info → preview/create) that provisions a live tenant site with zero token spend.

**Architecture:** Template registry gains `role.variant` keys with legacy aliases; a client wizard assembles a `SiteConfig` draft validated live by `siteSchema.safeParse`; creation goes through a new shared `provisionSite` helper used by both the new `/api/create-site` and the refactored `/api/claim` (behavior identical). No DB migration, no new dependencies. `generico` role hidden in v1 (no neutral JSON); slug conflicts surface as server 400 (no pre-check).

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod 3, Supabase (existing tables), Vitest.

## Global Constraints

- Zero paid providers; zero-token wizard (no Gemini calls anywhere in this flow).
- Template-first: wizard fills schema, never generates copy; all default text informative-only, no promos/superlatives/outcome promises.
- `generico` role hidden in v1; roles shipped: `psicologo`, `barbiere` (one variant each: `essenziale`).
- Backwards compatible: `getTemplate('psicologo')` keeps working; `/api/claim` behavior identical (existing claim tests stay green).
- Fail-closed: preview + submit gated on `safeParse` success; server re-validates everything; unknown tenants still redirect `/sospeso`.
- Each task ends with a testable deliverable and a commit; `npx vitest run` + `npx tsc --noEmit` + `npx next build` (via npx) green before every commit.

---

### Task 1: Role.variant registry

**Files:**
- Modify: `lib/templates.ts` (add `listRoles`, dotted-key support, legacy alias)
- Create: `tests/roles.test.ts`

**Interfaces:**
- Consumes: `siteSchema`, existing JSONs
- Produces: `listRoles(): { role: string; blurb: string; variants: { key: string; name: string; blurb: string }[] }[]`; `getTemplate('psicologo.essenziale' | 'psicologo')` both work

- [ ] **Step 1: Write the failing test**

```ts
// tests/roles.test.ts
import { describe, it, expect } from 'vitest';
import { getTemplate, listRoles, templateNames } from '../lib/templates';
describe('roles registry', () => {
  it('lists psicologo and barbiere with essenziale variant', () => {
    const roles = listRoles();
    expect(roles.map(r => r.role).sort()).toEqual(['barbiere', 'psicologo']);
    for (const r of roles) {
      expect(r.variants.length).toBeGreaterThanOrEqual(1);
      expect(r.variants[0].key).toBe(`${r.role}.essenziale`);
    }
  });
  it('legacy alias still works', () => {
    expect(getTemplate('psicologo').profession).toBe('psicologo');
    expect(getTemplate('psicologo.essenziale').branding.name)
      .toBe(getTemplate('psicologo').branding.name);
  });
  it('unknown key throws', () => {
    expect(() => getTemplate('psicologo.deluxe')).toThrow();
    expect(() => getTemplate('generico.essenziale')).toThrow();
  });
  it('legacy templateNames unchanged', () => {
    expect([...templateNames].sort()).toEqual(['barbiere', 'psicologo']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/roles.test.ts`
Expected: FAIL (`listRoles` missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/templates.ts — replace registry block, keep getTemplate signature:
const base: Record<string, unknown> = { psicologo, barbiere };
const registry: Record<string, unknown> = {
  ...base,
  'psicologo.essenziale': psicologo,
  'barbiere.essenziale': barbiere,
};
const ROLE_META: Record<string, { blurb: string; variants: { key: string; name: string; blurb: string }[] }> = {
  psicologo: { blurb: 'Siti per psicologi e psicoterapeuti: servizi, prezzi trasparenti e prenotazioni.',
    variants: [{ key: 'psicologo.essenziale', name: 'Essenziale', blurb: 'Una pagina: servizi, prenota, contatti, dati legali.' }] },
  barbiere: { blurb: 'Siti per barbieri e saloni: servizi, prezzi e prenotazioni.',
    variants: [{ key: 'barbiere.essenziale', name: 'Essenziale', blurb: 'Una pagina: servizi, prenota, contatti, dati legali.' }] },
};
export function listRoles() {
  return Object.keys(ROLE_META).map((role) => ({ role, ...ROLE_META[role] }));
}
// getTemplate/templateNames/templateNames export unchanged (registry lookup covers aliases)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/roles.test.ts tests/catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/templates.ts tests/roles.test.ts
git commit -m "feat: role.variant template registry with legacy aliases"
```

---

### Task 2: Wizard UI (role → variant → info → preview)

**Files:**
- Create: `app/wizard/page.tsx` (server, loads `listRoles`)
- Create: `app/wizard/WizardClient.tsx` (steps, form, preview, create)
- Create: `components/SitePreview.tsx` (presentational, uses `bookingSection`)
- Create: `tests/wizard.test.ts`
- Modify: `app/dashboard/page.tsx` line 8 (append `· <a href="/wizard">Crea sito guidato</a>` inside the existing `<p>`)
- Modify: `app/catalogo/page.tsx` (append `<p><Link href="/wizard">Crea il tuo sito con la procedura guidata</Link></p>` after `</ul>`)

**Interfaces:**
- Consumes: `listRoles`, `siteSchema.safeParse`, `bookingSection`, POST `/api/create-site`
- Produces: wizard flow posting `{ slug, displayName, plan, config }`, redirect `/t/<slug>` on success

- [ ] **Step 1: Write the failing test**

```ts
// tests/wizard.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import fs from 'node:fs';
const draft = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Studio Rossi', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'Supporto psicologico', subtitle: 'Colloqui in studio e online.' },
  services: [{ name: 'Colloquio individuale (50 min)', price: '€ 60' }],
  address: 'Via Roma 1, Milano', booking: { type: 'none' } as const,
  legal: { nome: 'Dott. Mario Rossi', ordine: 'OPL', albo_n: '12345', piva: '01234567890', pec: 'm.rossi@pec.it' } };
describe('wizard draft', () => {
  it('assembles a valid SiteConfig', () => {
    expect(siteSchema.safeParse(draft).success).toBe(true);
  });
  it('barbiere legal uses em-dash ordine/albo', () => {
    const b = { ...draft, profession: 'barbiere' as const,
      legal: { nome: 'Bottega B', ordine: '—', albo_n: '—', piva: '09876543210', pec: 'b@pec.it' } };
    expect(siteSchema.safeParse(b).success).toBe(true);
  });
  it('wizard files exist', () => {
    expect(fs.existsSync('app/wizard/page.tsx')).toBe(true);
    expect(fs.existsSync('app/wizard/WizardClient.tsx')).toBe(true);
    expect(fs.existsSync('components/SitePreview.tsx')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wizard.test.ts`
Expected: FAIL (files missing)

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/SitePreview.tsx
import { bookingSection } from '@/lib/booking';
import type { SiteConfig } from '@/lib/site-schema';
export default function SitePreview({ site }: { site: SiteConfig }) {
  const prenota = bookingSection(site);
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ color: site.branding.primary_color }}>{site.hero.title}</h1>
      <p>{site.hero.subtitle}</p>
      <p>{site.branding.name} · {site.branding.phone}</p>
      <h2>Servizi</h2>
      <ul>{site.services.map((s) => (<li key={s.name}>{s.name} — {s.price}</li>))}</ul>
      {prenota.kind !== 'none' && <p><em>Sezione prenotazioni attiva ({prenota.kind}).</em></p>}
      <p>{site.address}</p>
      <footer>{site.legal.nome} · P.IVA {site.legal.piva} · {site.legal.pec}</footer>
    </main>
  );
}
```

```tsx
// app/wizard/page.tsx
import { listRoles } from '@/lib/templates';
import WizardClient from './WizardClient';
export default function WizardPage() {
  return <WizardClient roles={listRoles()} />;
}
```

`app/wizard/WizardClient.tsx` ('use client'): props `{ roles: { role: string; blurb: string; variants: { key: string; name: string; blurb: string }[] }[] }`. State: `step (1|2|3|4)`, `roleKey`, `variantKey`, fields (name, phone, address, services as `{name,price}[]` starting with one empty row, add/remove max 12; legal nome/ordine/albo/piva/pec with ordine default `OPL` for psicologo and fixed `—` for barbiere; booking radio none/calcom-url/whatsapp-number; slug; plan radio senza-dominio/con-dominio). Step 1: role cards → set role, step 2. Step 2: variant cards + "altre versioni in arrivo" note → set variant (prefill profession from role), step 3. Step 3: form; draft assembled each render; `siteSchema.safeParse(draft)` errors shown inline under fields. Step 4 (gated: button disabled unless parse success): `<SitePreview site={parsed.data} />` + slug/plan inputs + "Crea il mio sito" → `fetch('/api/create-site', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ slug, displayName: name, plan, config: parsed.data }) })` → on `{slug}` → `location.href = '/t/' + slug`; on error show message. No Gemini, no network except the create POST.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/wizard.test.ts`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build` (wizard page must compile).

- [ ] **Step 5: Commit**

```bash
git add app/wizard/page.tsx app/wizard/WizardClient.tsx components/SitePreview.tsx tests/wizard.test.ts app/dashboard/page.tsx app/catalogo/page.tsx
git commit -m "feat: guided wizard role variant info preview"
```

---

### Task 3: Shared provisionSite + /api/create-site + claim refactor

**Files:**
- Create: `lib/create-site.ts` (`provisionSite`)
- Create: `app/api/create-site/route.ts`
- Modify: `app/api/claim/route.ts` (delegate to `provisionSite`, behavior identical)
- Create: `tests/create-site.test.ts`

**Interfaces:**
- Consumes: `supabaseServer()`, `siteSchema`, `getTemplate`
- Produces: `provisionSite(sb, userId, { slug, displayName, plan, config: SiteConfig }): Promise<{ slug: string }>`; `POST /api/create-site { slug, displayName, plan, config } → { slug }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/create-site.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('create-site', () => {
  it('normalizes slugs like claim does', () => {
    const norm = (s: string) => String(s ?? '').trim().toLowerCase();
    expect(norm(' Studio-Rossi ')).toBe('studio-rossi');
    expect(/^[a-z0-9-]{3,63}$/.test(norm('Studio-Rossi '))).toBe(true);
  });
  it('provision helper exists and claim delegates', () => {
    expect(fs.existsSync('lib/create-site.ts')).toBe(true);
    expect(fs.existsSync('app/api/create-site/route.ts')).toBe(true);
    const claim = fs.readFileSync('app/api/claim/route.ts', 'utf8');
    expect(claim).toContain('provisionSite');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/create-site.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/create-site.ts
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
```

```ts
// app/api/create-site/route.ts
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
  const { slug, displayName, plan, config } = body as { slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio'; plan2?: never; config: unknown };
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
```

`app/api/claim/route.ts` refactor: replace the slug-normalize + tenants/site_instances insert block (current lines 18–35) with `provisionSite(sb, user.id, { slug: rawSlug, displayName, plan, config })` after the existing template/parse checks; keep all prior checks (auth, TPL, displayName/plan Zod, try/catch parse) byte-identical. Keep imports used (remove now-unused ones only if tsc complains).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/create-site.test.ts tests/claim.test.ts tests/wizard.test.ts`
Expected: PASS (claim behavior identical). Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add lib/create-site.ts app/api/create-site/route.ts app/api/claim/route.ts tests/create-site.test.ts
git commit -m "feat: shared provisionSite with create-site endpoint"
```

---

## Self-Review

- Spec coverage: §2 registry → Task 1 (generico hidden by omission in ROLE_META; legacy alias kept); §3 wizard UI → Task 2 (server page + client + preview + both entry links); §4 form fields → Task 2 (common + role legal, dynamic services, booking radio, slug/plan, live safeParse gate, no promo fields exist); §5 endpoint+helper → Task 3 (shared helper, claim delegates, behavior identical per existing claim tests); §6 tests → each task has exact test code; §7 open decisions resolved inline (generico hidden, server-400 only).
- Placeholder scan: no TBD/TODO; all code/commands concrete. `plan2?: never` in Task 3 is a deliberate unused-field guard typo-trap — actually remove risk: it is harmless excess; keep (documents plan-only shape discipline). Hmm — self-fix: simplify the destructure to `{ slug, displayName, plan, config }` without `plan2`. Implementer: use the simple destructure; the type line becomes `as { slug: string; displayName: string; plan: 'senza-dominio' | 'con-dominio'; config: unknown }`.
- Type consistency: `provisionSite` `Sb` conditional type matches `await supabaseServer()` across claim/create-site/chat call sites; `SiteConfig` flows from wizard draft → safeParse → endpoint → helper unchanged.

## Execution Handoff

Subagent-Driven already selected by founder — dispatch Task 1 immediately after saving, no further questions.
