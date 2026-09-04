-- 007_owner_policies_authenticated_only.sql
-- Advisors follow-up (2026-09-04): scope owner policies TO authenticated.
-- anon can never satisfy owner_id = auth.uid(), so evaluation outcome is
-- identical, but the hot anon path (public pages) now checks a single policy.
-- Remaining multiple_permissive WARNs on authenticated are by design (see 006).

drop policy if exists "owners read own tenants" on public.tenants;
create policy "owners read own tenants" on public.tenants for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "owners insert own tenants" on public.tenants;
create policy "owners insert own tenants" on public.tenants for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "owners update own tenants" on public.tenants;
create policy "owners update own tenants" on public.tenants for update to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "owners read own site" on public.site_instances;
create policy "owners read own site" on public.site_instances for select to authenticated using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())));
drop policy if exists "owners write own site" on public.site_instances;
create policy "owners write own site" on public.site_instances for all to authenticated using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())))
  with check (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = (select auth.uid())));

drop policy if exists "owners read own status events" on public.tenant_status_events;
create policy "owners read own status events" on public.tenant_status_events for select to authenticated using (
  exists (select 1 from public.tenants t where t.id = tenant_status_events.tenant_id and t.owner_id = (select auth.uid())));
