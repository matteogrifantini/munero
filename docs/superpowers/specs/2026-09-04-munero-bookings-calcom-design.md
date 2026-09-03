# Munero Slice C Design: Cal.com Bookings (A1) + Psicologo Template v1

Date: 2026-09-04
Status: Approved by founder (A1 embed direction + psicologo extraction plan)
Scope: Slice C-A1 only. Webhook sync (A2), per-service event types, and `@calcom/embed-react` upgrade are documented non-goals with explicit hooks.

## 1. Goal & Success Criteria

Every tenant site can offer real appointment booking through the professional's own Cal.com account, at zero cost and zero token spend, without Munero storing any booking data. The first catalog template is `psicologo`, derived from the founder's production site (dottoressaveronica, Next.js 15 + `@calcom/embed-react`), stripped of all deontologically non-compliant patterns.

Success metrics: booking section renders on `/t/[slug]` within the existing page budget; suspended tenants expose zero booking UI; `imposta prenotazioni cal.com <url>` applies via the zero-token fast path; manual E2E books a real Cal.com test event.

## 2. Config: site_schema v1.1 (backwards compatible)

```ts
booking: z.union([
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('calcom'),
    url: z.string().url().refine(
      (u) => /^https:\/\/(cal\.com|cal\.eu)(\/|$)/.test(u),
      'Solo URL Cal.com (cal.com / cal.eu)') }),
  z.object({ type: z.literal('whatsapp'),
    number: z.string().regex(/^\+?[0-9 ]{6,20}$/) }),
]).default({ type: 'none' })
```

Rules: `booking` is top-level and optional; v1 configs without it parse to `{ type: 'none' }`. The URL allowlist (`cal.com`, `cal.eu`, https only) is the single anti-phishing control and is enforced at claim time, at chat-edit time (pre and post), and at render time (defensive re-check before emitting the iframe). No arbitrary iframe URLs ever.

## 3. Renderer: Prenota section (`/t/[slug]`, deterministic)

- `calcom` → `<section id="prenota">` with heading "Prenota un appuntamento", lazy iframe `src="{url}?embed&hideBranding"` in a 16:10 responsive container, privacy line "La prenotazione avviene su Cal.com. Munero non memorizza i tuoi dati.", and a fallback anchor "Apri in una nuova scheda" (covers iframe blockers).
- `whatsapp` → button to `https://wa.me/<number>` with neutral prefill text containing only the site name (never symptoms or service details).
- `none` → section omitted entirely (no empty boxes on demo sites).
- v1 uses iframe only, no `@calcom/embed-react` script: fewer third-party scripts, CSP-friendly. The source site proves the embed-react upgrade path; it is a documented later swap, not v1 scope.

## 4. Kill-switch coherence

`/sospeso` is unchanged (neutral, no booking UI). The tenant page redirects to `/sospeso` before rendering any section, so a suspended site can never collect orphan bookings. v1 has no bookings table: nothing to purge, nothing to leak. (A2 will need a purge rule; noted, not implemented.)

## 5. Chat edits (zero-token fast path first)

New `tryFastEdit` intents, tried before any Gemini call:
- `imposta prenotazioni cal.com <url>` → patch `{ booking: { type: 'calcom', url } }` (allowlist-validated; invalid URL → blocked with reason, no Gemini call).
- `togli prenotazioni` → `{ booking: { type: 'none' } }`.
- `solo whatsapp <numero>` / `prenotazioni whatsapp <numero>` → `{ booking: { type: 'whatsapp', number } }`.
- Any other booking-flavored request (sync agenda, online payments, multi-event setup) → Gemini fallback, whose system prompt gains one line: booking changes outside `{type,url,number}` must answer `__blocked__` (out of A1 scope).

## 6. Psicologo template v1 (from dottoressaveronica)

Source: founder's production site (Next.js 15, Tailwind, Cal.com embed-react with per-service event types e.g. `colloquio-psicologico-individuale-online/studio`, transparent `price: 50`, FAQ JSON-LD, legal footer). Extraction is content-shape only: no source code, no binaries, no styles are copied. Tenant images are placeholders replaced at claim time via Storage upload (later task).

Included sections (single-page, informative tone only): hero (title + subtitle, no outcome promises) → servizi with transparent prices (`€ 50` format from `price` numbers) → Prenota (Cal.com, global event URL in v1; per-service online/studio/domicilio variants deferred to A2) → dove ricevo (address) → FAQ (plain text, no schema markup in v1) → contatti (phone/WhatsApp) → legal footer (nome, ordine, albo_n, piva, pec; direttore_sanitario only where applicable).

Explicitly excluded with rationale (Legge 145/2018 + FNOMCeO/CNOP deontology):
- `promo-benvenuto`, `promo-ostetricia`, `PromoBanner` (discount/promotional offers banned for healthcare).
- `ExitIntentPopup`, `PhoneCaptureForm` (suggestive capture, commercial pressure).
- `GoogleReviews` section (testimonials as promotional lever are deontologically unsafe).
- Checkout pages with packages (commercial packaging of care).
- Blog + multi-page routing (out of single-page template scope, revisit post-v1).

## 7. Tests

- Allowlist unit tests: accept `https://cal.com/u/e`, `https://cal.eu/u/e`, deep subpaths; reject `http://`, `javascript:`, `https://evil-cal.com/u`, `https://cal.com.evil.it/u`.
- Fast-edit tests: set/remove/whatsapp intents apply with zero tokens; invalid URL blocked; out-of-scope booking requests pass through unmatched.
- Renderer tests: `none` → no prenota markup; `calcom` → iframe with allowlisted src + fallback link; `/sospeso` → zero booking markup.
- Manual E2E: real Cal.com test event books end-to-end from a claimed demo site; suspended tenant shows no booking UI within ~30s.

## 8. GDPR posture (founder-accepted)

Munero stores zero booking data in A1 (no table, prompt contains only public site config). The professional owns their Cal.com account and signs Cal.com's DPA (SCCs for the US transfer). Prenota section carries the privacy line from §3. Known residual: Cal.com free cloud is US-hosted and a psychology booking is Art. 9-sensitive; accepted for A1, revisit via native EU form or self-hosted Cal.com only if an Ordine objects.

## 9. Open decisions for writing-plans

1. iframe `?embed&hideBranding` param set vs plain URL (verify against a live Cal.com event).
2. Seed `psicologo.json` demo Cal.com URL: placeholder `https://cal.com/` (renders fallback link) vs founder's real test event.
3. `docs/import-template.md` (deferred from Phase 1): fold founder's future site imports into the plan's first task or keep separate.
