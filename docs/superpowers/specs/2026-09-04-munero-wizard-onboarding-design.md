# Munero Wizard Onboarding Design: Role → Variant → Info → Site

Date: 2026-09-04
Status: Approved (founder waived interruptions; Sections 1+2 self-approved under standing template-first constraints)
Scope: Wizard v1. Future variants content, dashboard overhaul, and add-on marketplace are explicit non-goals.

## 1. Goal & Success Criteria

A non-technical professional goes from landing to live site in 4 deterministic steps with zero token spend: pick role → pick variant → fill guided info → preview and create. Success: valid configs only (preview gated on `siteSchema.safeParse`), claimed site renders at `/t/<slug>` immediately, full suite + build green.

## 2. Registry: role.variant keys (backwards compatible)

```ts
// lib/templates.ts additions (existing getTemplate/templateNames untouched in behavior)
listRoles(): { role: string; blurb: string; variants: { key: string; name: string; blurb: string }[] }[]
// keys: 'psicologo.essenziale' (→ psicologo.json), 'barbiere.essenziale' (→ barbiere.json),
// 'generico.essenziale' (→ barbiere.json as neutral base? NO — generico has no JSON: v1 roles are psicologo + barbiere only)
```
v1 roles: `psicologo`, `barbiere` (the only JSONs in repo). `getTemplate` accepts both `psicologo` (legacy alias) and `psicologo.essenziale`; unknown keys throw as today. New variant JSONs later = one registry row each, zero code.

## 3. Wizard UI

- `app/wizard/page.tsx` (server): loads `listRoles()`, renders `<WizardClient roles={...} />`. Entry links added to dashboard + catalogo (one line each, no redesign).
- `app/wizard/WizardClient.tsx` (client): step state 1–4 with back navigation; selections kept in React state, nothing persisted until creation.
  - Step 1 role cards (name + blurb). Step 2 variant cards (v1: single card per role + "altre versioni in arrivo" note — honest, no fake choices).
  - Step 3 info form (see §4). Step 4 preview via `<SitePreview config={...} />` + slug/plan fields + "Crea il mio sito" (disabled until valid) → POST `/api/create-site` → redirect `/t/<slug>`.
- `components/SitePreview.tsx`: shared presentational renderer (hero, servizi, prenota via `bookingSection`, address, legal footer). Same markup as tenant/demo pages. Demo-page refactor to reuse it is deferred (noted minor).

## 4. Info form fields (deterministic, Zod-validated live)

Common: studio/professional name, phone, address, services dynamic list (name + price, add/remove, max 12), booking radio (none / cal.com URL / whatsapp number), slug, plan (`senza-dominio`/`con-dominio`).
Role legal: psicologo → nome, ordine (default `OPL`), albo_n, piva, pec; barbiere → nome, piva, pec (ordine/albo fixed `—`, not editable).
Forbidden: no promo/discount/review/testimonial fields anywhere, ever. Live validation: `siteSchema.safeParse(draft)` on every change; errors shown inline; preview + submit gated on success.

## 5. Creation endpoint (shared helper, no duplication)

```ts
// lib/create-site.ts
provisionSite(sb, userId, { slug, displayName, plan, config: SiteConfig }): Promise<{ slug: string }>
// normalizes slug (trim/lowercase, regex), validates displayName/plan, inserts tenants + site_instances
```
- POST `/api/create-site { slug, displayName, plan, config }`: auth → `siteSchema.parse` in try/catch (400) → `provisionSite`.
- `/api/claim` refactored to call `provisionSite` with `getTemplate(template)` output: behavior identical (existing claim tests must stay green).

## 6. Tests

- Registry: `listRoles` shape, legacy alias `psicologo` works, unknown key throws.
- Provision: slug normalization (spaces/uppercase accepted → normalized), bad slug/displayName/plan rejected, corrupt config 400.
- Wizard: form draft assembles valid SiteConfig; preview gated on invalid (component test or fs-grep per existing patterns — implementer picks, reviewer judges).
- Manual E2E: wizard → created site renders at `/t/<slug>` with Prenota hidden (booking none default).

## 7. Open decisions for the plan

1. `generico` role in v1: hidden until a neutral JSON exists (recommended) vs alias to barbiere.
2. Slug ownership pre-check (HEAD query before submit) for friendlier errors vs server-400 only (recommended: server-400 only, YAGNI).
