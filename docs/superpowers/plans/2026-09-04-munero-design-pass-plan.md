# Visual Design Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Munero a complete, elegant visual identity: polished tenant sites (themed per-tenant from schema) and a coherent Munero-branded shell (landing, catalog, wizard, dashboard, chat, auth).

**Architecture:** Tailwind (already installed, currently unused) + `next/font` (Playfair Display for headings, Inter for body). Per-tenant theming via CSS variable `--accent` set from `site.branding.primary_color` — no AI, no new deps, zero runtime cost. One shared `components/SiteView.tsx` renders tenant sites everywhere (public page, demo, wizard preview), replacing the three duplicated markups.

**Tech Stack:** Next.js 16, Tailwind 3 (installed), next/font, existing Zod schema (untouched).

## Design direction (founder-delegated, locked)

"Eleganza professionale italiana": warm paper background (#faf8f4), ink text (#1c1917), serif display headings, generous whitespace, soft bordered cards, accent color per tenant. Munero brand: deep green (#1e3d2b) + warm gold accent (#c9a227), used on landing/catalog/wizard/dashboard/chat/auth. Informative-only copy unchanged. No gradients-as-crutch, no emojis, no dark patterns. Mobile-first (clientele on phones).

## Global Constraints

- Schema untouched: no fields added/removed; `primary_color` drives `--accent` (must remain valid hex per existing regex).
- Template-first preserved: one shared renderer, no per-tenant custom code.
- Italian copy only; deontological tone; booking privacy line and legal footer must render on every tenant site.
- Kill-switch/suspension page stays neutral (style it, keep zero tenant branding).
- Each task ends with a testable deliverable and a commit; `npx vitest run` + `npx tsc --noEmit` + `npx next build` (via npx) green before every commit.

---

### Task 1: Design system (fonts, theme, shell components)

**Files:**
- Modify: `app/layout.tsx` (fonts + lang + metadata title), `app/globals.css` (theme vars, base styles), `tailwind.config.ts` (font families, brand colors)
- Create: `components/ui.tsx` (`Container`, `MButton` as styled link/button, `Card`, `SectionTitle`, `Field`, `BrandHeader` with Munero wordmark, `BrandFooter`)
- Create: `tests/design.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `components/ui.tsx` exports used by Tasks 2-3; CSS var `--accent` convention (`style={{ ['--accent' as never]: color }}`)

- [ ] **Step 1: Write the failing test**

```ts
// tests/design.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('design system', () => {
  it('layout loads fonts and shell components exist', () => {
    const layout = fs.readFileSync('app/layout.tsx', 'utf8');
    expect(layout).toMatch(/next\/font/);
    expect(layout).toMatch(/Playfair Display|playfair/i);
    expect(fs.existsSync('components/ui.tsx')).toBe(true);
  });
  it('theme exposes accent variable and brand colors', () => {
    const css = fs.readFileSync('app/globals.css', 'utf8');
    expect(css).toContain('--accent');
    const tw = fs.readFileSync('tailwind.config.ts', 'utf8');
    expect(tw).toMatch(/brand|1e3d2b/i);
  });
  it('ui exports all shell primitives', () => {
    const src = fs.readFileSync('components/ui.tsx', 'utf8');
    for (const n of ['Container', 'MButton', 'Card', 'SectionTitle', 'Field', 'BrandHeader', 'BrandFooter']) {
      expect(src).toContain(n);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

`app/layout.tsx`: `import { Playfair_Display, Inter } from 'next/font/google'` (latin subsets), CSS vars, `<html lang="it">`, body classes `bg-[#faf8f4] text-stone-900 antialiased`, metadata `{ title: 'Munero — Siti per professionisti', description: '...' }`.
`tailwind.config.ts`: `fontFamily: { display: ['var(--font-display)', 'serif'], sans: ['var(--font-sans)', 'sans-serif'] }`, `colors: { brand: { DEFAULT: '#1e3d2b', deep: '#14291d', gold: '#c9a227' }, paper: '#faf8f4' }`.
`app/globals.css`: keep tailwind directives; add `:root{--accent:#1e3d2b}` body base (bg paper, font sans), headings `font-display` via utility classes in components (not global h1 overrides — tenant accent must win), selection color, focus-visible rings.
`components/ui.tsx`: Container (max-w-3xl/5xl variants), MButton (link-styled, `variant: 'primary'|'ghost'`, uses `--accent` bg for primary), Card (rounded-2xl border bg-white shadow-sm), SectionTitle (serif, accent eyebrow), Field (label+input+error styles for wizard/forms), BrandHeader (Munero wordmark serif + nav: Catalogo, Accedi/Dashboard), BrandFooter (Munero contact + "Piattaforma in comodato d'uso").

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/design.test.ts`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css tailwind.config.ts components/ui.tsx tests/design.test.ts
git commit -m "feat: munero design system with brand shell"
```

---

### Task 2: Shared SiteView tenant renderer

**Files:**
- Create: `components/SiteView.tsx` (polished tenant site, `--accent` from schema)
- Modify: `app/t/[slug]/page.tsx`, `app/demo/[template]/page.tsx` (render `<SiteView site={site} />` inside existing fail-closed logic — touch only the JSX return, keep fetch/guard lines byte-identical)
- Modify: `app/wizard/WizardClient.tsx` (preview step uses `<SiteView>` instead of `SitePreview`; keep `components/SitePreview.tsx` file to avoid breaking imports elsewhere — re-export SiteView from it)
- Create: `tests/siteview.test.ts`

**Interfaces:**
- Consumes: `SiteConfig`, `bookingSection`, shell primitives from `components/ui.tsx`
- Produces: `components/SiteView.tsx` default export used by all three surfaces

- [ ] **Step 1: Write the failing test**

```ts
// tests/siteview.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('siteview', () => {
  it('shared renderer exists with accent theming and required sections', () => {
    expect(fs.existsSync('components/SiteView.tsx')).toBe(true);
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    expect(src).toContain('--accent');
    for (const s of ['Servizi', 'prenota', 'P.IVA', 'Cal.com']) expect(src).toContain(s);
  });
  it('all three surfaces use the shared renderer', () => {
    for (const f of ['app/t/[slug]/page.tsx', 'app/demo/[template]/page.tsx', 'app/wizard/WizardClient.tsx']) {
      expect(fs.readFileSync(f, 'utf8')).toContain('SiteView');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/siteview.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

`components/SiteView.tsx`: `<div style={{ '--accent': site.branding.primary_color }}>` wrapper; sticky mini-header (brand name + phone button); hero (serif title, subtitle, accent rule); servizi as cards grid with price chips; Prenota section (reuse exact logic/copy from current pages: iframe 16:10 lazy + privacy line + fallback link / WhatsApp button / hidden on none); address + phone block; footer (nome, ordine/albo where not `—`, P.IVA, PEC). All Tailwind, mobile-first. Keep every data string from schema (no invented copy).
Tenant/demo/wizard: replace inner JSX with `<SiteView site={site} />` (+ demo keeps its "Usa questo modello" link below; wizard keeps step chrome). `components/SitePreview.tsx` becomes `export { default } from './SiteView';` (compat re-export).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/siteview.test.ts tests/prenota.test.ts tests/catalog.test.ts tests/wizard.test.ts`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add components/SiteView.tsx components/SitePreview.tsx "app/t/[slug]/page.tsx" "app/demo/[template]/page.tsx" app/wizard/WizardClient.tsx tests/siteview.test.ts
git commit -m "feat: shared polished SiteView tenant renderer"
```

---

### Task 3: Munero chrome (landing, catalog, wizard, dashboard, chat, auth, sospeso)

**Files:**
- Modify: `app/page.tsx`, `app/catalogo/page.tsx`, `app/dashboard/page.tsx`, `app/chat/page.tsx`, `app/attiva/page.tsx`, `app/sospeso/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/wizard/WizardClient.tsx` (step chrome only: cards/buttons/fields via ui.tsx, keep all logic byte-identical)
- Create: `tests/chrome.test.ts`

**Interfaces:**
- Consumes: `components/ui.tsx` primitives
- Produces: coherent branded pages; zero logic changes (same fetches, same handlers, same validation)

- [ ] **Step 1: Write the failing test**

```ts
// tests/chrome.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
const pages = ['app/page.tsx', 'app/catalogo/page.tsx', 'app/dashboard/page.tsx', 'app/chat/page.tsx', 'app/sospeso/page.tsx'];
describe('munero chrome', () => {
  it('pages use brand shell, no raw padding-32 mains remain', () => {
    for (const f of pages) {
      const src = fs.readFileSync(f, 'utf8');
      expect(src).toMatch(/BrandHeader|Container/);
      expect(src).not.toContain('padding: 32');
    }
  });
  it('sospeso stays neutral (no tenant data, munero contact only)', () => {
    const src = fs.readFileSync('app/sospeso/page.tsx', 'utf8');
    expect(src).not.toMatch(/site\.|tenant/i);
    expect(src).toMatch(/sospeso/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/chrome.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Landing (`app/page.tsx`): BrandHeader + hero (serif headline "Il sito del tuo studio, senza pensieri", sub, CTA wizard + catalogo) + 3 cards (Template per ruolo / Modifiche via chat / Prenotazioni Cal.com) + pricing hint (senza/con dominio) + BrandFooter.
Catalogo: role-grouped cards with variant blurbs (from `listRoles`), link demo + wizard CTA.
Dashboard: sites as cards (name, slug link, status chip, plan) + actions (wizard, chat); login gate kept.
Chat/attiva/auth: Field/Button/Card styling, same handlers; error/success states styled, same strings.
Sospeso: styled neutral card (Munero contact only, zero tenant refs).
WizardClient chrome: role/variant cards, Field inputs, MButton nav — logic/state/validation byte-identical.

- [ ] **Step 4: Run tests to verify they pass**

Run: full `npx vitest run`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/catalogo/page.tsx app/dashboard/page.tsx app/chat/page.tsx app/attiva/page.tsx app/sospeso/page.tsx "app/(auth)/login/page.tsx" "app/(auth)/register/page.tsx" app/wizard/WizardClient.tsx tests/chrome.test.ts
git commit -m "feat: munero brand chrome on all pages"
```

---

## Self-Review

- Coverage: design tokens → T1; tenant surfaces → T2 (public, demo, wizard preview unified); shell pages → T3. Schema untouched (no task modifies it); kill-switch logic untouched (only JSX returns); chat/guardrail logic untouched.
- No placeholders: exact files, code, commands. Test style matches repo (fs-grep + behavior asserts).
- Type consistency: `SiteConfig`/`bookingSection` reuse; `--accent` var convention documented once in T1.

## Execution Handoff

Subagent-Driven already selected — dispatch Task 1 immediately, no further questions.
