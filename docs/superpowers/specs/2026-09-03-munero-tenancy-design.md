# Munero — Slice A Design: Multi-Tenancy, Routing & Edge Kill-Switch

Date: 2026-09-03
Status: Approved working hypothesis (stack left open per founder)
Scope: Slice A only. Slices B–E are evaluation-level references; each gets its own spec cycle.

## 1. Goal & Success Criteria

Provide closed multi-tenant WaaS ("comodato d'uso") where:

- Each tenant resolves via `slug.munero.it` and optional custom domain (`www.cliente.it`).
- Custom domains get automatic SSL with zero manual cert work.
- Subscription stop → public site + PWA deactivated centrally within 60s, with no origin DB hit and no health-data exposure.
- Routing overhead < 100ms p95 globally (Italy-first, EU data residency).
- Origin double-check prevents stale-edge resurrection of suspended tenants.

Success metrics: time-to-suspend < 60s from webhook; routing lookup p95 < 50ms; 0 cross-tenant renders in CI chaos tests; custom-domain onboarding < 10 min of founder ops.

## 2. Working Hypothesis (not locked)

Next.js (App Router) + Cloudflare for SaaS + Supabase Postgres. Astro and Remix documented as rejected-for-now alternatives (see §7). Founder instruction to keep stack evaluation open is respected: this doc defines interfaces so the renderer can be swapped.

## 3. Architecture

```
Browser
  → Cloudflare Edge (Cloudflare for SaaS, per-hostname SSL)
    → Routing Worker: KV HOSTNAME_MAP lookup
        → miss / suspended → static 402 suspension page (no origin fetch)
        → active / past_due_grace → forward to origin + `x-tenant-id`
          → Next.js middleware.ts: re-validate `tenants.status` (Supabase)
            → suspended → 402 (defense in depth)
            → active → rewrite `/t/[slug]/...` → ISR render from `site_configs`
```

Two layers of kill-switch (edge KV + origin DB) are intentional. Edge gives speed and origin shielding; origin gives correctness when KV is stale.

### 3.1 DNS & SSL (Cloudflare for SaaS)

- `cname.munero.it` is the SaaS origin target.
- Tenant custom domain: `CNAME www.cliente.it → cname.munero.it` (apex via CNAME flattening).
- Cloudflare for SaaS custom-hostname API provisions DCV + SSL automatically. Store hostname verification state in `tenants.domain_status ∈ {pending, verifying, active, failed}`.
- `slug.munero.it` is always available as fallback, even before/after custom-domain setup.

### 3.2 Edge routing & suspension

KV namespace `HOSTNAME_MAP`: key = lowercased hostname, value = `{ tenantId, slug, status, plan }`.

Worker logic:

1. Normalize `Host` (lowercase, strip port, strip `www.` alias handling via canonical map).
2. `KV.get(host)`. On miss → 404 neutral page (no tenant info leak).
3. `status === 'suspended' | 'deleted'` → return static suspension HTML, `Cache-Control: public, max-age=60`, status 402.
4. `status === 'past_due_grace'` → forward + `x-tenant-grace: 1` header so UI can show admin-only banner (never to public visitors? decision: show discreet owner banner only on `?owner-preview`).
5. Otherwise forward to origin with `x-tenant-id`, `x-tenant-slug`.

Suspension page requirements (legal/UX): neutral wording "Servizio temporaneamente sospeso — contatta Munero", Munero contact only, no tenant branding, no service/price/health content, no tracking beyond privacy-friendly analytics.

### 3.3 Origin safety net (Next.js middleware)

`middleware.ts` runs on all `/t/*` and custom-domain rewrites:

```ts
// conceptual
import { createClient } from '@/lib/supabase-server';
export async function middleware(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id')
    ?? await resolveSlug(req.nextUrl);
  if (!tenantId) return rewrite('/_neutral/unknown-tenant');
  const { data } = await supabase
    .from('tenants').select('id,status,slug').eq('id', tenantId).single();
  if (!data || data.status === 'suspended' || data.status === 'deleted')
    return new Response(SUSPENDED_HTML, { status: 402 });
  const res = NextResponse.rewrite(new URL(`/t/${data.slug}${req.nextUrl.pathname}`, req.url));
  res.headers.set('x-tenant-id', data.id);
  return res;
}
export const config = { matcher: ['/((?!_next|_static|manifest|api/health).*)'] };
```

Middleware uses a short-TTL cache (e.g. 30s) for tenant status to avoid per-request DB storms, but TTL << billing grace so suspension still propagates fast; KV purge + `revalidateTag` is the fast path.

## 4. Data Model (Slice A tables)

```sql
-- tenants: single source of truth for routing + billing state
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,63}$'),
  display_name text not null,
  custom_domain text unique,               -- null until onboarded
  domain_status text not null default 'pending'
    check (domain_status in ('pending','verifying','active','failed')),
  status text not null default 'active'
    check (status in ('active','past_due_grace','suspended','deleted')),
  plan text not null default 'base'
    check (plan in ('base','premium','enterprise')),
  created_at timestamptz not null default now()
);

-- hostname_map is a MATERIALIZED projection of tenants into KV,
-- synced by trigger/webhook, not a Postgres table.
-- site_configs and bookings belong to Slices B/C; referenced here only by tenant_id FK.
```

Sync trigger: on `tenants` insert/update → `pg_net` / Supabase webhook → `/api/internal/sync-hostname` (service_role, IP + secret guarded) → upsert KV `custom_domain` + `slug.munero.it` entries, purge old hostname on domain change, call `revalidateTag('tenant:{id}')`.

Billing webhook: Stripe `customer.subscription.deleted / past_due` → `tenants.status` transition (`active → past_due_grace (7–14d) → suspended`) → same sync path. Suspension SLA measured from webhook receipt to KV-visible block.

## 5. Interfaces (renderer-agnostic)

- `resolveTenant(host: string): Promise<{ tenantId, slug, status } | null>` — edge implementation reads KV; origin implementation reads Supabase. Same signature so Astro/Remix swap stays possible.
- `requireActiveTenant(tenantId): Promise<Tenant>` — throws `TenantSuspended` / `TenantNotFound`; pages and API routes must call it server-side.
- `syncHostnameMap(tenantId)` — internal only, idempotent, logs `{ tenantId, hostnames, kvVersion }`.

No client component ever receives another tenant's id. `x-tenant-id` is set server-side and asserted on every server action with `assertTenantScope(input.tenantId, headers)`.

## 6. Error Handling

| Case | Edge behavior | Origin behavior |
|---|---|---|
| Unknown hostname | 404 neutral, no tenant leak | rewrite `/_neutral/unknown-tenant` |
| KV miss but DB hit | n/a (edge miss) | serve normally + async backfill KV |
| KV hit stale-active, DB suspended | edge serves (stale ≤60s) | middleware blocks 402 + triggers KV repair |
| DB unreachable in middleware | n/a | fail-closed: 503 neutral + `Retry-After: 30`, never serve cached tenant page |
| Domain verification fails | hostname stays `verifying`, slug URL keeps working | dashboard shows DNS fix instructions |

Fail-closed is mandatory: any doubt about status → block, never render.

## 7. Alternatives Considered

- **A2 Astro + Workers:** faster LCP, weaker dashboard/PWA/ISR story → rejected for v1, revisit if LCP misses 2.5s on 4G after template hardening.
- **A3 Remix + Workers:** best form ergonomics, weaker ISR caching + smaller IT hiring pool → rejected unless team skill dictates.
- **Schema-per-tenant / DB-per-tenant:** deferred to enterprise tier; default is shared DB + RLS (Slice C spec will define RLS policies + tests).

## 8. Testing

- Unit: hostname normalization, status state machine transitions.
- Integration: Stripe webhook → DB → KV mock → edge block asserted; domain change purges old hostname.
- E2E/chaos: render `tenant-a` hostname, assert zero `tenant-b` strings in HTML/headers; kill KV mid-test → origin still blocks suspended tenant (fail-closed).
- Load: 1k rps routing mix, p95 KV lookup < 50ms (k6 or Cloudflare observability).

## 9. Ops & Residency Notes

- EU region for Supabase project + R2/Storage buckets; KV metadata contains only `{ tenantId, slug, status }`, no personal or health data.
- Audit table `tenant_status_events(tenant_id, old, new, reason, actor, at)` for billing disputes and Ordine traceability.
- Runbook: `suspendTenant(id, reason)` / `restoreTenant(id)` scripts that update DB + force KV purge + verify via `curl -H 'Host:'` checks.

## 10. Out of Scope (later slices)

- B: Zod schema engine + templates + `revalidateTag` payload design.
- C: `site_configs` / `bookings` RLS, minimal-form rules, Art.9 redaction.
- D: per-tenant `manifest.webmanifest`, service worker scope, Capacitor pipeline.
- E: deterministic deontological blocklists + classifier + Telegram/WhatsApp HITL.

## 11. Open Decisions for Writing-Plans

1. Hosting target for Next.js origin: Cloudflare Pages vs Vercel (latency/cost/EU-residency comparison).
2. KV vs D1 vs Upstash for hostname map (write-propagation SLA test).
3. Grace-period length (7 vs 14 days) + banner visibility rule.
