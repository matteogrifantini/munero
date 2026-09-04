-- 006_perf_indexes_initplan.sql
-- Performance hardening from Supabase advisors audit (2026-09-04):
-- covering indexes for FKs + auth_rls_initplan fix ((select auth.uid())).
-- NOTE: multiple_permissive_policies on SELECT is accepted by design:
-- owner policies (own rows incl. suspended, for dashboard) and public policies
-- (active rows only, for public pages) have intentionally different semantics.

create index if not exists tenants_owner_id_idx on public.tenants (owner_id);
create index if not exists tenant_status_events_tenant_id_idx on public.tenant_status_events (tenant_id);

drop policy if exists "owners read own tenants" on public.tenants;
create policy "owners read own tenants" on public.tenants for select using ((select auth.uid()) = owner_id);
drop policy if exists "owners insert own tenants" on public.tenants;
create policy "owners insert own tenants" on public.tenants for insert with check ((select auth.uid()) = owner_id);
drop policy if exists "owners update own tenants" on public.tenants;
create policy "owners update own tenants" on public.tenants for update using ((select auth.uid()) = owner_id);

drop policy if exists "owners read own site" on public.site_instances;
create policy "owners read own site" on public.site_instances for select using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())));
drop policy if exists "owners write own site" on public.site_instances;
create policy "owners write own site" on public.site_instances for all using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())))
  with check (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())));

drop policy if exists "owners read own status events" on public.tenant_status_events;
create policy "owners read own status events" on public.tenant_status_events for select using (
  exists (select 1 from public.tenants t where t.id = tenant_status_events.tenant_id and t.owner_id = (select auth.uid())));
