# Rich Template + Rich Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tenant sites become rich single-pages (hero, servizi, chi-sono, orari, prenota, FAQ, contatti, footer legale) and the Munero landing becomes a real marketing page (hero with live mockup, how-it-works, templates, pricing, Munero FAQ, CTA) — all template-driven, deontologically clean, zero new backends.

**Architecture:** `site_schema` grows three all-optional sections (`about`, `faq[]`, `hours`) with hide-when-empty rendering (old configs parse unchanged, no DB migration). `SiteView` gains Chi-sono / Orari / FAQ (native `<details>` accordion, zero JS) sections. Chat fast-edit gains an `orari` intent; FAQ/about edits flow through the existing Gemini fallback (schema-validated). Landing is static JSX reusing `SiteView` mini-preview + primitives. No new dependencies, no new tables.

**Tech Stack:** Next.js 16, Tailwind v4, HeroUI v3, Zod 3, Vitest + Playwright.

## Global Constraints

- Backwards compatible: new schema keys optional with hide-when-empty; old v1 configs parse and render exactly as today.
- Deontological: informative-only copy everywhere on tenant templates (no promos, superlatives, outcome promises, reviews); Munero's OWN landing may carry marketing copy (Munero is not a healthcare professional) but no false claims.
- Template-first: one SiteView for all tenants; no per-tenant code; chat only JSON patches.
- Fail-closed: invalid configs redirect /sospeso (unchanged); empty sections render nothing.
- Each task ends with a testable deliverable and a commit; `npx vitest run` + `npx tsc --noEmit` + `npx next build` (via npx) + `npx playwright test` green before every commit.

---

### Task 1: Schema v1.2 + rich renderer + chat intents

**Files:**
- Modify: `lib/site-schema.ts` (add `about`, `faq`, `hours` — all optional, hide-when-empty)
- Modify: `components/SiteView.tsx` (Chi-sono, Orari, FAQ sections)
- Modify: `lib/fast-edit.ts` (orari intent; keep price/address/phone/booking blocks byte-identical)
- Modify: `tests/fast-edit.test.ts` base (add new keys) ONLY if type requires
- Create: `tests/rich.test.ts`

**Interfaces:**
- Consumes: `SiteConfig`, `bookingSection`
- Produces: `about?: { title: string; body: string; points: string[] }`, `faq: { q: string; a: string }[]`, `hours: string` on SiteConfig

- [ ] **Step 1: Write the failing test**

```ts
// tests/rich.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import { tryFastEdit } from '../lib/fast-edit';
import fs from 'node:fs';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'S', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'T', subtitle: 'S' }, services: [{ name: 'Colloquio', price: '€ 60' }],
  address: 'Via Roma 1', booking: { type: 'none' } as const,
  legal: { nome: 'N', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('rich schema', () => {
  it('old configs parse with empty rich sections', () => {
    const c = siteSchema.parse(base);
    expect(c.faq).toEqual([]);
    expect(c.hours).toBe('');
    expect(c.about).toBeUndefined();
  });
  it('accepts full rich payload', () => {
    const c = siteSchema.parse({ ...base,
      about: { title: 'Chi sono', body: 'Psicologa dal 2010.', points: ['Iscritta OPL', 'EMDR'] },
      faq: [{ q: 'Quanto dura?', a: '50 minuti.' }],
      hours: 'Lun–Ven 9–19' });
    expect(c.faq?.length).toBe(1);
  });
  it('rejects oversized faq', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ q: `Q${i}`, a: 'Risposta lunga abbastanza.' }));
    expect(siteSchema.safeParse({ ...base, faq: many }).success).toBe(false);
  });
  it('fast-edit updates hours with zero tokens', () => {
    const r = tryFastEdit({ ...base, hours: '' }, 'cambia orari in Lun Ven 9 19');
    expect(r.matched).toBe(true);
    expect(r.patch).toMatchObject({ hours: expect.stringContaining('Lun') });
  });
  it('siteview renders about/faq/hours sections', () => {
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    for (const s of ['about', 'faq', 'hours', '<details']) expect(src).toContain(s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rich.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/site-schema.ts — append inside z.object after booking:
  about: z.object({
    title: z.string().min(3).max(60),
    body: z.string().min(10).max(1200),
    points: z.array(z.string().min(2).max(120)).max(6),
  }).optional(),
  faq: z.array(z.object({ q: z.string().min(3).max(140), a: z.string().min(10).max(600) })).max(8).default([]),
  hours: z.string().max(200).default(''),
```

`components/SiteView.tsx` — after servizi grid, before Prenota:
- about (if set): SectionTitle title=about.title + body paragraph + points as checkmark list (accent `✓` text span, no emoji).
- hours (if non-empty): Card with "Orari" title + hours text.
- faq (if length): SectionTitle "Domande frequenti" + `<details className="..."><summary>{q}</summary><p>{a}</p></details>` per item (native accordion).

`lib/fast-edit.ts` — before final `return { matched: false }`, after booking block:
```ts
  const hours = message.match(/(?:orari|orario)(?: di apertura)?(?: in| a|:)?\s*(.+)/i);
  if (/orar/.test(msgLower) && hours) return { matched: true, patch: { hours: hours[1].trim().slice(0, 200) } };
```
Keep all existing blocks byte-identical. No Gemini prompt change needed (fallback validates via schema).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/rich.test.ts tests/fast-edit.test.ts tests/catalog.test.ts tests/prenota.test.ts`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build` + `npx playwright test`.

- [ ] **Step 5: Commit**

```bash
git add lib/site-schema.ts components/SiteView.tsx lib/fast-edit.ts tests/rich.test.ts tests/fast-edit.test.ts
git commit -m "feat: rich schema v1.2 with about faq hours"
```

---

### Task 2: Rich content for psicologo + barbiere

**Files:**
- Modify: `content/templates/psicologo.json` (add about/faq/hours, keep booking none)
- Modify: `content/templates/barbiere.json` (same, trade-appropriate)
- Modify: `tests/catalog.test.ts` (assert rich sections present on both; banned-word tripwire extended to new copy)

**Interfaces:**
- Consumes: v1.2 schema
- Produces: demo pages render 8 sections; wizard prefill inherits richness automatically

- [ ] **Step 1: Write the failing test**

```ts
// append inside describe('catalog') in tests/catalog.test.ts (read file for placement):
  it('templates carry rich informative sections', () => {
    for (const t of [psicologo, barbiere] as any[]) {
      const c = siteSchema.parse(t);
      expect(c.about!.body.length).toBeGreaterThan(50);
      expect(c.faq!.length).toBeGreaterThanOrEqual(3);
      expect(c.hours!.length).toBeGreaterThan(3);
      const blob = JSON.stringify(c).toLowerCase();
      for (const banned of ['sconto', 'offerta', 'promo', 'garant', 'miglior', 'recension', 'risultati garantiti']) {
        expect(blob).not.toContain(banned);
      }
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog.test.ts`
Expected: FAIL (no rich sections)

- [ ] **Step 3: Write minimal implementation**

psicologo about: title "Chi sono", body ~2 frasi informative (formazione, approccio, prima visita conoscitiva — nessuna promessa), points ["Iscritta all'Ordine degli Psicologi", "Colloqui in studio e online", "Adulti e adolescenti"]. hours "Lun – Ven 9:00 – 19:00, solo su appuntamento". faq 4: durata/costo prima visita? (costo ok informativo: "Quanto costa?" → "Le tariffe sono esposte nella sezione servizi"), online?, minore?, privacy ("Come sono trattati i miei dati?" → titolare/contitolare note brevi).
barbiere about: title "La bottega", body mestiere/prezzi esposti, points ["Taglio classico e moderno", "Rasatura con lama", "Solo su prenotazione"]. hours "Mar – Sab 9:00 – 19:30, dom/lun chiuso". faq 3: prenotazione?, ritardo?, bambini?
All Italian, informative, zero banned words (watch "miglior" never appears; "garant" never).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/catalog.test.ts`
Expected: PASS. Then full suite + `tsc` + build + playwright (demo pages now longer — screenshots update automatically).

- [ ] **Step 5: Commit**

```bash
git add content/templates/psicologo.json content/templates/barbiere.json tests/catalog.test.ts
git commit -m "feat: rich informative content for both templates"
```

---

### Task 3: Rich landing + dashboard polish

**Files:**
- Modify: `app/page.tsx` (full rich landing, static)
- Modify: `app/dashboard/page.tsx` (empty-state already exists; add stats row: n. siti, n. sospesi + link docs? keep: counts line above grid)
- Modify: `tests/chrome.test.ts` (assert new landing blocks; read file first for style)
- Test: `tests/chrome.test.ts`

**Interfaces:**
- Consumes: `SiteView` (mini mockup), `listRoles`, ui primitives
- Produces: landing with hero+mockup, come-funziona, template, prezzi, faq-munero, cta

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/chrome.test.ts (read file first):
  it('landing is rich: mockup, steps, pricing, faq', () => {
    const src = fs.readFileSync('app/page.tsx', 'utf8');
    for (const s of ['SiteView', 'Come funziona', 'Prezzi', 'Domande frequenti', 'senza-dominio', 'con-dominio']) {
      expect(src).toContain(s);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/chrome.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

`app/page.tsx` sections (static, Munero marketing voice allowed — no health claims):
1. Hero: headline + sub + 2 CTA (wizard, catalogo) + live mini mockup (scaled SiteView of psicologo template, same pattern as catalog showcase).
2. "Come funziona" 3 steps cards (1 Scegli il modello, 2 Inserisci le info, 3 Modifica via chat).
3. "Modelli per ruolo" — reuse listRoles cards (compact, link catalogo).
4. "Prezzi" 2 cards: Senza dominio (slug.munero.it, €/mese placeholder? NO invented prices — use "A partire da" generic? Prices are business decisions: label "Piano Base"/"Piano Dominio" with "Contattaci per i prezzi" CTA mailto. No invented numbers.)
5. "Domande frequenti" Munero (5 static details: serve il dominio? chi scrive i testi? e se disdico? i miei dati? sanitariosí?) — Munero FAQ, marketing-allowed.
6. Final CTA + BrandFooter.
`app/dashboard/page.tsx`: above grid, one line `Hai {n} siti ({s} sospesi)` computed from data. Keep everything else identical.

- [ ] **Step 4: Run tests to verify they pass**

Run: full `npx vitest run`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build` + `npx playwright test` (landing screenshot will show richness — review it).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/dashboard/page.tsx tests/chrome.test.ts
git commit -m "feat: rich landing with mockup pricing faq"
```

---

## Self-Review

- Coverage: schema+renderer+chat → T1; content → T2; landing+dashboard → T3. Kill-switch/guardrail/provision untouched. No migrations, no deps.
- No placeholders: exact code/commands/copy skeletons. Copy skeletons are skeletons with explicit constraints — implementer writes final Italian within them (reviewer judges deontology).
- Type consistency: `about?`, `faq` (default []), `hours` (default '') across schema, SiteView guards, fast-edit patch, tests.

## Execution Handoff

Subagent-Driven already selected — dispatch Task 1 immediately, no further questions.
