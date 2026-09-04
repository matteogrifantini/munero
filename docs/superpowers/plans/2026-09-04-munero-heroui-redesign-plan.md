# HeroUI Redesign + Template Showcase + Demo Prefill Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the handmade styling with HeroUI v3 components (impeccable, modern direction), showcase templates visually in the catalog with live mini-previews, and make demo/testing instant via one-click demo-data prefill (wizard) and one-click demo-site creation (dashboard).

**Architecture:** Upgrade Tailwind 3.4 → v4 (CSS-first `@theme`, mandatory for HeroUI v3) + `@heroui/styles` + `@heroui/react` + `tailwind-variants`. No provider needed (v3). `components/ui.tsx` re-exports/restyles on HeroUI primitives keeping identical export names so pages keep working; `SiteView` redesigned with HeroUI Card/Button/Chip/Divider; catalog renders each template as a live scaled-down `SiteView` preview. Zero new backend; zero AI; existing schema/logic untouched.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, HeroUI v3 (compound API, `onPress`), next/font (kept), Vitest.

## Global Constraints

- Official HeroUI v3 setup only: `npm i @heroui/styles @heroui/react tailwind-variants`; globals.css `@import "tailwindcss";` FIRST then `@import "@heroui/styles";`; postcss plugin `@tailwindcss/postcss`; NO provider; compound components (`Card.Header` style); `onPress` not `onClick` on HeroUI components. Do NOT apply v2 patterns (`HeroUIProvider`, `@heroui/theme`, framer-motion).
- Before using any HeroUI component, verify its export exists in the installed `node_modules/@heroui/react` (ls the package or grep exports) — never import unverified names.
- Locked brand direction preserved: paper background, ink text, Playfair Display headings, Munero deep green + gold, per-tenant `--accent` from schema. HeroUI theme extended (not replaced) with these tokens.
- Schema/logic untouched: no schema changes; kill-switch, guardrail, chat, provision flows byte-identical in behavior; Italian informative-only copy; sospeso neutral.
- Each task ends with a testable deliverable and a commit; `npx vitest run` + `npx tsc --noEmit` + `npx next build` (via npx) green before every commit.

---

### Task 1: Tailwind v4 + HeroUI install + theme

**Files:**
- Modify: `package.json` (tailwindcss ^4, add `@tailwindcss/postcss`, `@heroui/styles`, `@heroui/react`, `tailwind-variants`; remove `autoprefixer`), `postcss.config.mjs` (plugins: `{"@tailwindcss/postcss": {}}`), `app/globals.css` (v4 imports + `@theme` tokens + base styles), `app/layout.tsx` (keep fonts; no provider)
- Delete: `tailwind.config.ts` (v4 CSS-first; tokens move to `@theme`)
- Modify: `tests/design.test.ts` (assert `@theme` tokens in globals.css instead of tailwind.config.ts; assert heroui styles import; keep font/ui-exports asserts, adjust paths if needed after reading the file)
- Test: `tests/design.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: working Tailwind v4 + HeroUI CSS pipeline; `@theme` tokens `--font-display`, `--font-sans`, `--color-brand-*`, `--color-paper`

- [ ] **Step 1: Write the failing test**

```ts
// modify tests/design.test.ts: replace the tailwind.config.ts block with:
  it('v4 theme tokens live in globals.css with heroui styles', () => {
    const css = fs.readFileSync('app/globals.css', 'utf8');
    expect(css.indexOf('@import "tailwindcss"')).toBeLessThan(css.indexOf('@import "@heroui/styles"'));
    expect(css).toContain('@theme');
    expect(css).toMatch(/--color-brand/);
    expect(css).toMatch(/--font-display/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/design.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```json
// package.json deps (exact): tailwindcss ^4.1.0, @tailwindcss/postcss ^4.1.0, @heroui/styles ^3.0.0, @heroui/react ^3.0.0, tailwind-variants ^3.0.0; remove autoprefixer. Keep next/font, zod, supabase, next 16.3.4, react 19.2.8.
```

```js
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

```css
/* app/globals.css */
@import "tailwindcss";
@import "@heroui/styles";
@theme {
  --font-display: "Playfair Display", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --color-paper: #faf8f4;
  --color-ink: #1c1917;
  --color-brand: #1e3d2b;
  --color-brand-deep: #14291d;
  --color-brand-gold: #c9a227;
}
:root { --accent: #1e3d2b; }
body { background: #faf8f4; color: #1c1917; font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
::selection { background: #c9a227; color: #1c1917; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

`app/layout.tsx`: keep Playfair_Display + Inter via next/font (attach variables as today), keep metadata/lang, NO provider wrapper. Delete `tailwind.config.ts` (`git rm`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/design.test.ts`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build` (v4 + heroui must compile; 16+ pages).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json postcss.config.mjs app/globals.css app/layout.tsx tests/design.test.ts
git rm -q tailwind.config.ts
git commit -m "feat: tailwind v4 with heroui v3 theme"
```

---

### Task 2: ui.tsx + SiteView on HeroUI

**Files:**
- Modify: `components/ui.tsx` (same export names: Container, MButton link+button paths, Card→HeroUI Card compound, SectionTitle, Field→HeroUI Input, BrandHeader→HeroUI Navbar, BrandFooter)
- Modify: `components/SiteView.tsx` (HeroUI Card/Chip/Divider/Button, sticky Navbar tenant header, footer)
- Modify: `tests/design.test.ts` + `tests/siteview.test.ts` (extend: assert heroui imports in ui.tsx/SiteView; keep all existing asserts passing — read both files first)
- Test: `tests/design.test.ts`, `tests/siteview.test.ts`

**Interfaces:**
- Consumes: `@heroui/react` verified exports, `--accent` convention, `bookingSection`
- Produces: identical export names/signatures (all pages keep working with zero changes)

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/siteview.test.ts:
  it('siteview uses heroui primitives', () => {
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    expect(src).toMatch(/@heroui\/react/);
    expect(src).toContain('--accent');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/siteview.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

First verify exports: `ls node_modules/@heroui/react/dist` or grep package exports for `Button Card Chip Divider Input Navbar Link` (v3 compound: `Card.Header`, `Card.Body` etc.). Use ONLY verified names. Rules: `onPress` for actions (Link `href` for navigation), no `HeroUIProvider`, no framer-motion.
`components/ui.tsx`: keep export names + props compatible (Container/MButton as="button"/Card/SectionTitle/Field/BrandHeader/BrandFooter). BrandHeader → HeroUI Navbar with Munero wordmark + Catalogo/Accedi links; Field → HeroUI Input with error message slot (keep `role="alert"`); MButton primary → HeroUI Button with `bg-[var(--accent)]` retained for tenant contexts.
`components/SiteView.tsx`: same sections/data/copy as today (hero, servizi, prenota incl. privacy line + fallback, address, legal footer) restyled: Navbar tenant header (name + tel button), hero with accent surfaces, servizi grid of HeroUI Cards with price Chips, Divider separators, footer. Mobile-first. No invented copy, no emojis.

- [ ] **Step 4: Run tests to verify they pass**

Run: full `npx vitest run`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add components/ui.tsx components/SiteView.tsx tests/design.test.ts tests/siteview.test.ts
git commit -m "feat: heroui-powered ui primitives and siteview"
```

---

### Task 3: Visual template showcase + demo prefill

**Files:**
- Modify: `app/catalogo/page.tsx` (each variant card embeds a live scaled `SiteView` mini-preview: fixed-height overflow-hidden wrapper + `pointer-events-none` + CSS `transform: scale(0.4)` origin-top, rendering `getTemplate(role)` data; below: demo link + wizard CTA)
- Modify: `app/wizard/WizardClient.tsx` (add "Riempi dati demo" button on step 3: fills every field from `getTemplate`-equivalent defaults passed as prop — implementer: pass template JSON for the chosen role from server page as `demoData` prop; zero tokens; keep validation/logic identical)
- Modify: `app/wizard/page.tsx` (load template JSON for demoData prop)
- Modify: `app/dashboard/page.tsx` (add "Crea sito demo" button: POSTs `/api/create-site` with the psicologo template config + slug `demo-<uid8>` + displayName `Sito demo` + plan `senza-dominio`; same Supabase query/handler patterns as chat page; styled, same strings style)
- Create: `tests/showcase.test.ts`

**Interfaces:**
- Consumes: `SiteView`, `getTemplate`, POST `/api/create-site`
- Produces: visual catalog; one-click demo prefill + demo-site creation

- [ ] **Step 1: Write the failing test**

```ts
// tests/showcase.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('showcase', () => {
  it('catalog renders live mini previews', () => {
    const src = fs.readFileSync('app/catalogo/page.tsx', 'utf8');
    expect(src).toContain('SiteView');
    expect(src).toMatch(/scale\(|transform/);
    expect(src).toContain('pointer-events-none');
  });
  it('wizard has demo prefill and dashboard has demo-site creation', () => {
    const w = fs.readFileSync('app/wizard/WizardClient.tsx', 'utf8');
    expect(w).toMatch(/Riempi dati demo/i);
    const d = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
    expect(d).toMatch(/api\/create-site/);
    expect(d).toMatch(/demo-/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/showcase.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Catalog card preview block (per variant, data = `getTemplate(roleKey)`):
```tsx
<div className="h-64 overflow-hidden rounded-xl border" aria-hidden="true">
  <div className="pointer-events-none origin-top-left" style={{ transform: 'scale(0.4)', width: '250%' }}>
    <SiteView site={data} />
  </div>
</div>
```
Wizard: `demoData: SiteConfig` prop (server page: `getTemplate(roleDefault)` — role changes reload? simpler: pass map `{ [role]: SiteConfig }` for all roles; button fills fields incl. services/legal/booking none + slug suggestion `studio-prova`; validation unchanged). Dashboard: client button → fetch POST create-site `{ slug: 'demo-' + crypto.randomUUID().slice(0,8), displayName: 'Sito demo', plan: 'senza-dominio', config: psicologoTemplate }` → link result; needs client interactivity: dashboard is a server component — add small client component `components/DemoSiteButton.tsx` ('use client', HeroUI Button, onPress) imported by dashboard. Template JSON for dashboard: import psicologo.json directly (server component, already pattern in catalogo).

- [ ] **Step 4: Run tests to verify they pass**

Run: full `npx vitest run`
Expected: PASS. Then `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add app/catalogo/page.tsx app/wizard/page.tsx app/wizard/WizardClient.tsx app/dashboard/page.tsx components/DemoSiteButton.tsx tests/showcase.test.ts
git commit -m "feat: visual template showcase with demo prefill"
```

---

## Self-Review

- Coverage: v4+HeroUI pipeline → T1; primitives+SiteView → T2; showcase+prefill → T3. Locked brand tokens preserved via @theme; schema/logic untouched (only JSX/classNames + sanctioned demo POST reusing create-site).
- No placeholders: exact deps, CSS, commands, test code. Implementer verifies HeroUI exports before importing (explicit step).
- Type consistency: export names unchanged (ui.tsx, SiteView); `SiteConfig` flows untouched; demoData prop typed.

## Execution Handoff

Subagent-Driven already selected — dispatch Task 1 immediately, no further questions.
