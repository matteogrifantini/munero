# Slice C (Cal.com A1 + Psicologo Template) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tenant sites gain a deterministic Prenota section (Cal.com iframe or WhatsApp, hidden when unconfigured), editable via zero-token chat intents, and the catalog ships a full psicologo v1 template derived from the founder's production site with all deontologically banned patterns excluded.

**Architecture:** `site_schema` grows an all-optional `booking` union (existing v1 rows parse to `{ type: 'none' }`, no DB migration). A pure helper (`bookingSection`) maps config to render props with a defensive allowlist re-check; both the public page and the demo page use it. Chat fast-edit gains booking intents tried before Gemini, including a fail-closed `blocked` path for invalid URLs that never spends tokens.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod 3, Supabase (no new tables, no migration), Vitest. No new dependencies (iframe embed, no `@calcom/embed-react`).

## Global Constraints

- Zero paid providers: Supabase Free, Vercel Hobby, Gemini free tier only.
- Template-first: no AI-generated sites; chat outputs only JSON patches against `site_schema`.
- Booking allowlist: only `https://cal.com/*` and `https://cal.eu/*` may render as iframes; everything else is blocked.
- Munero stores zero booking data: prompts contain only public site config; no bookings table in A1.
- Healthcare tone purely informative; deontological blocklist enforced pre and post (Legge 145/2018, FNOMCeO/CNOP); template excludes promos, reviews, popups, checkouts.
- Fail-closed: unknown/suspended tenants and invalid configs render `/sospeso` or hide the section, never a broken embed.
- Each task ends with a testable deliverable and a commit; `npx vitest run` + `npx tsc --noEmit` + `npx next build` (via npx) green before every commit.

---

### Task 1: Schema v1.1 + booking allowlist lib

**Files:**
- Modify: `lib/site-schema.ts` (add `booking` union with default, keep `schema_version: z.literal('v1')`)
- Create: `lib/booking.ts` (allowlist + embed URL helpers)
- Create: `tests/booking.test.ts`
- Modify: `tests/fast-edit.test.ts` (add `booking: { type: 'none' } as const` to `base`, required by the new `SiteConfig` type)

**Interfaces:**
- Consumes: `siteSchema`, `SiteConfig` (existing)
- Produces: `isAllowedBookingUrl(u: string): boolean`, `toEmbedUrl(u: string): string` in `lib/booking.ts`; `SiteConfig['booking']` type `{ type: 'none' } | { type: 'calcom'; url: string } | { type: 'whatsapp'; number: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/booking.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import { isAllowedBookingUrl, toEmbedUrl } from '../lib/booking';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Dott.ssa E', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'Supporto psicologico', subtitle: 'Colloqui in studio e online.' },
  services: [{ name: 'Colloquio individuale (50 min)', price: '€ 60' }],
  address: 'Via Roma 1, Milano',
  legal: { nome: 'Dott.ssa E', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('booking schema v1.1', () => {
  it('defaults missing booking to none (backwards compatible)', () => {
    expect(siteSchema.parse(base).booking).toEqual({ type: 'none' });
  });
  it('accepts calcom url', () => {
    const c = siteSchema.parse({ ...base, booking: { type: 'calcom', url: 'https://cal.com/veronica/colloquio' } });
    expect(c.booking).toEqual({ type: 'calcom', url: 'https://cal.com/veronica/colloquio' });
  });
  it('rejects non-cal urls', () => {
    expect(siteSchema.safeParse({ ...base, booking: { type: 'calcom', url: 'https://evil.com/x' } }).success).toBe(false);
    expect(siteSchema.safeParse({ ...base, booking: { type: 'calcom', url: 'https://cal.com.evil.it/x' } }).success).toBe(false);
  });
  it('accepts whatsapp, rejects bad number', () => {
    expect(siteSchema.parse({ ...base, booking: { type: 'whatsapp', number: '+39 333 000 0000' } }).booking.type).toBe('whatsapp');
    expect(siteSchema.safeParse({ ...base, booking: { type: 'whatsapp', number: 'abc' } }).success).toBe(false);
  });
});
describe('allowlist', () => {
  it('accepts cal.com / cal.eu subpaths, rejects rest', () => {
    expect(isAllowedBookingUrl('https://cal.com/u/e')).toBe(true);
    expect(isAllowedBookingUrl('https://cal.eu/u/e')).toBe(true);
    expect(isAllowedBookingUrl('http://cal.com/u')).toBe(false);
    expect(isAllowedBookingUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedBookingUrl('https://evil-cal.com/u')).toBe(false);
  });
  it('builds embed url', () => {
    expect(toEmbedUrl('https://cal.com/u/e')).toBe('https://cal.com/u/e?embed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/booking.test.ts`
Expected: FAIL (lib/booking.ts missing, schema has no booking)

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/site-schema.ts — append inside z.object, after legal:
  booking: z.union([
    z.object({ type: z.literal('none') }),
    z.object({ type: z.literal('calcom'),
      url: z.string().url().refine(
        (u) => /^https:\/\/(cal\.com|cal\.eu)(\/|$)/.test(u),
        'Solo URL Cal.com (cal.com / cal.eu)') }),
    z.object({ type: z.literal('whatsapp'),
      number: z.string().regex(/^\+?[0-9 ]{6,20}$/) }),
  ]).default({ type: 'none' }),
```

```ts
// lib/booking.ts
export const BOOKING_URL_RE = /^https:\/\/(cal\.com|cal\.eu)(\/|$)/;
export function isAllowedBookingUrl(u: string): boolean {
  try { return BOOKING_URL_RE.test(u.trim()); } catch { return false; }
}
export function toEmbedUrl(u: string): string {
  const url = u.trim();
  return url.includes('?') ? `${url}&embed` : `${url}?embed`;
}
```

In `tests/fast-edit.test.ts` line 7, extend `base` with `booking: { type: 'none' } as const,` after `address`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/booking.test.ts tests/fast-edit.test.ts tests/catalog.test.ts`
Expected: PASS (catalog seeds parse via default)

- [ ] **Step 5: Commit**

```bash
git add lib/site-schema.ts lib/booking.ts tests/booking.test.ts tests/fast-edit.test.ts
git commit -m "feat: site_schema booking union with cal.com allowlist"
```

---

### Task 2: Prenota renderer + chat booking intents

**Files:**
- Modify: `lib/booking.ts` (append `bookingSection`)
- Modify: `app/t/[slug]/page.tsx` (Prenota section via helper, after address, before footer)
- Modify: `app/demo/[template]/page.tsx` (same Prenota section via helper, after address, before footer)
- Modify: `lib/fast-edit.ts` (booking intents + optional `blocked` return)
- Modify: `app/api/chat-edit/route.ts` (handle `fast.blocked`; SYSTEM +1 line for out-of-scope booking requests)
- Create: `tests/prenota.test.ts`

**Interfaces:**
- Consumes: `isAllowedBookingUrl`, `toEmbedUrl`, `SiteConfig`, `tryFastEdit` existing intents
- Produces: `bookingSection(site: SiteConfig): { kind: 'none' } | { kind: 'calcom'; embedUrl: string; openUrl: string } | { kind: 'whatsapp'; waLink: string }`; extended `tryFastEdit` return `{ matched: boolean; patch?: Record<string, unknown>; blocked?: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/prenota.test.ts
import { describe, it, expect } from 'vitest';
import { bookingSection } from '../lib/booking';
import { tryFastEdit } from '../lib/fast-edit';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Dott.ssa E', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'T', subtitle: 'S' }, services: [{ name: 'Colloquio', price: '€ 60' }],
  address: 'Via Roma 1, Milano', booking: { type: 'none' } as const,
  legal: { nome: 'N', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('bookingSection', () => {
  it('hides on none', () => { expect(bookingSection(base)).toEqual({ kind: 'none' }); });
  it('builds calcom embed props', () => {
    const r = bookingSection({ ...base, booking: { type: 'calcom', url: 'https://cal.com/v/e' } });
    expect(r).toEqual({ kind: 'calcom', embedUrl: 'https://cal.com/v/e?embed', openUrl: 'https://cal.com/v/e' });
  });
  it('fail-closed on non-allowlisted url', () => {
    const r = bookingSection({ ...base, booking: { type: 'calcom', url: 'https://evil.com/x' } as never });
    expect(r).toEqual({ kind: 'none' });
  });
  it('builds whatsapp link without health prefill', () => {
    const r = bookingSection({ ...base, booking: { type: 'whatsapp', number: '+39 333 000 0000' } });
    expect(r.kind).toBe('whatsapp');
    if (r.kind === 'whatsapp') {
      expect(r.waLink.startsWith('https://wa.me/393330000000')).toBe(true);
      expect(r.waLink).not.toMatch(/ansia|colloquio|psicolog/i);
    }
  });
});
describe('fast-edit booking intents', () => {
  it('sets calcom url with zero tokens', () => {
    const r = tryFastEdit(base, 'imposta prenotazioni cal.com https://cal.com/veronica/colloquio');
    expect(r.matched).toBe(true);
    expect(r.patch).toEqual({ booking: { type: 'calcom', url: 'https://cal.com/veronica/colloquio' } });
  });
  it('blocks invalid url without gemini', () => {
    const r = tryFastEdit(base, 'imposta prenotazioni https://evil.com/x');
    expect(r.matched).toBe(false);
    expect(r.blocked).toMatch(/cal\.com/i);
  });
  it('removes booking', () => {
    const r = tryFastEdit(base, 'togli le prenotazioni dal sito');
    expect(r).toMatchObject({ matched: true, patch: { booking: { type: 'none' } } });
  });
  it('sets whatsapp', () => {
    const r = tryFastEdit(base, 'prenotazioni solo whatsapp +39 333 111 1111');
    expect(r).toMatchObject({ matched: true, patch: { booking: { type: 'whatsapp', number: '+39 333 111 1111' } } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/prenota.test.ts`
Expected: FAIL (`bookingSection` missing, intents missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/booking.ts — append:
import type { SiteConfig } from './site-schema';
export type BookingSection =
  | { kind: 'none' }
  | { kind: 'calcom'; embedUrl: string; openUrl: string }
  | { kind: 'whatsapp'; waLink: string };
export function bookingSection(site: SiteConfig): BookingSection {
  const b = site.booking;
  if (b.type === 'calcom') {
    if (!isAllowedBookingUrl(b.url)) return { kind: 'none' };
    return { kind: 'calcom', embedUrl: toEmbedUrl(b.url), openUrl: b.url.trim() };
  }
  if (b.type === 'whatsapp') {
    const digits = b.number.replace(/[^\d]/g, '');
    const text = encodeURIComponent(`Buongiorno ${site.branding.name}, vorrei informazioni.`);
    return { kind: 'whatsapp', waLink: `https://wa.me/${digits}?text=${text}` };
  }
  return { kind: 'none' };
}
```

```tsx
// Prenota JSX — insert in BOTH app/t/[slug]/page.tsx and app/demo/[template]/page.tsx
// after the address <p>, before <footer>. Add import: import { bookingSection } from '@/lib/booking';
// and const prenota = bookingSection(site); before return.
{prenota.kind === 'calcom' && (
  <section id="prenota">
    <h2>Prenota un appuntamento</h2>
    <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0 }}>
      <iframe src={prenota.embedUrl} title="Prenotazione" loading="lazy" style={{ position: 'absolute', width: '100%', height: '100%', border: 0 }} />
    </div>
    <p>La prenotazione avviene su Cal.com. Munero non memorizza i tuoi dati.</p>
    <p><a href={prenota.openUrl} target="_blank" rel="noreferrer">Apri in una nuova scheda</a></p>
  </section>
)}
{prenota.kind === 'whatsapp' && (
  <section id="prenota">
    <h2>Prenota un appuntamento</h2>
    <p><a href={prenota.waLink} target="_blank" rel="noreferrer">Contattaci su WhatsApp</a></p>
  </section>
)}
```

```ts
// lib/fast-edit.ts — change signature, append intents before `return { matched: false };`:
export function tryFastEdit(config: SiteConfig, message: string): { matched: boolean; patch?: Record<string, unknown>; blocked?: string } {
  // ... keep existing price/address/phone blocks unchanged ...
  const msgLower = message.toLowerCase();
  if (/prenotaz|booking|appuntament/.test(msgLower)) {
    if (/togli|rimuovi|disattiva|nascondi/.test(msgLower))
      return { matched: true, patch: { booking: { type: 'none' } } };
    const wa = message.match(/whatsapp[^\d+]*(\+?[0-9][0-9 ./-]{5,})/i);
    if (wa) {
      const digits = wa[1].replace(/[^\d]/g, '');
      if (digits.length >= 6) return { matched: true, patch: { booking: { type: 'whatsapp', number: wa[1].trim() } } };
      return { matched: false };
    }
    const url = message.match(/https?:\/\/[^\s)]+/i);
    if (url && isAllowedBookingUrl(url[0]))
      return { matched: true, patch: { booking: { type: 'calcom', url: url[0].trim() } } };
    if (url || /cal\.?com|cal\.?eu/.test(msgLower))
      return { matched: false, blocked: 'URL non valido: sono accettati solo link Cal.com (https://cal.com/… o https://cal.eu/…).' };
    return { matched: false };
  }
  return { matched: false };
}
// add import: import { isAllowedBookingUrl } from './booking';
```

```ts
// app/api/chat-edit/route.ts — replace the fast-path branch:
  if (fast.matched) {
    patch = fast.patch!;
  } else if (fast.blocked) {
    return NextResponse.json({ blocked: true, reason: fast.blocked }, { status: 200 });
  } else {
// and extend SYSTEM with: ' Le modifiche alle prenotazioni fuori da {type,url,number} (sincronizzazione agenda, pagamenti) non sono supportate: rispondi {"__blocked__": true}.'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/prenota.test.ts tests/fast-edit.test.ts tests/guardrail.test.ts tests/chat-edit.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean and `npx next build` green (both pages must compile).

- [ ] **Step 5: Commit**

```bash
git add lib/booking.ts lib/fast-edit.ts "app/t/[slug]/page.tsx" "app/demo/[template]/page.tsx" app/api/chat-edit/route.ts tests/prenota.test.ts
git commit -m "feat: prenota section with cal.com embed and zero-token chat intents"
```

---

### Task 3: Psicologo template v1 content

**Files:**
- Modify: `content/templates/psicologo.json` (full v1 rewrite, pretty-printed)
- Modify: `tests/catalog.test.ts` (assert booking defaults to none + 3 services)

**Interfaces:**
- Consumes: `siteSchema` v1.1, `getTemplate`
- Produces: catalog psicologo entry with informative-only copy; no promos, reviews, popups, or packages anywhere in the JSON

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/catalog.test.ts inside the existing describe (read the file first for exact placement):
  it('psicologo v1 has booking none and informative services', () => {
    const t = siteSchema.parse(psicologo);
    expect(t.booking).toEqual({ type: 'none' });
    expect(t.services.length).toBeGreaterThanOrEqual(3);
    const blob = JSON.stringify(t).toLowerCase();
    for (const banned of ['sconto', 'offerta', 'promo', 'garant', 'miglior', 'recension']) {
      expect(blob).not.toContain(banned);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/catalog.test.ts`
Expected: FAIL (1 service only, booking assertion on old shape still passes but services count fails)

- [ ] **Step 3: Write minimal implementation**

```json
// content/templates/psicologo.json (pretty-printed, demo data only)
{
  "schema_version": "v1",
  "profession": "psicologo",
  "branding": { "name": "Studio di Psicologia Esempio", "primary_color": "#2f5d50", "phone": "+39 333 000 0000" },
  "hero": { "title": "Supporto psicologico in studio e online", "subtitle": "Colloqui individuali, di coppia e percorsi per la genitorialità. Approccio informativo, senza promesse di risultato." },
  "services": [
    { "name": "Colloquio individuale (50 min)", "price": "€ 60" },
    { "name": "Colloquio di coppia (60 min)", "price": "€ 80" },
    { "name": "Consulenza online (50 min)", "price": "€ 60" }
  ],
  "address": "Via Roma 1, 20121 Milano",
  "booking": { "type": "none" },
  "legal": { "nome": "Dott.ssa Maria Esempio", "ordine": "OPL", "albo_n": "00000", "piva": "01234567890", "pec": "maria.esempio@pec.it" }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/catalog.test.ts`
Expected: PASS. Then full suite + `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 5: Commit**

```bash
git add content/templates/psicologo.json tests/catalog.test.ts
git commit -m "feat: psicologo template v1 with informative-only copy"
```

---

## Self-Review

- Spec coverage: §2 schema+allowlist → Task 1; §3 renderer → Task 2 (both pages); §4 kill-switch → no new code needed (existing redirect covers it; renderer never reached when suspended) — verified by design, no task required; §5 chat intents → Task 2 (incl. `blocked` path + SYSTEM line); §6 template → Task 3 (single-page sections mapped: hero/servizi/prenota via booking none/address/contatti via phone/legal; blog/checkout/promo/reviews/popup excluded and test-banned); §7 tests → each task has exact test code; §8 GDPR → zero-storage preserved (no tables, no migration), privacy line in JSX.
- Placeholder scan: no TBD/TODO; every step has file paths, code, and commands. The `as never` cast in Task 2 test is intentional (invalid config must fail closed at runtime).
- Type consistency: `booking` union names (`none`/`calcom`/`whatsapp`) identical across schema, `bookingSection`, fast-edit patches, and tests; `via` field untouched; `SiteConfig` flows unchanged.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-04-munero-slice-c-calcom.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
