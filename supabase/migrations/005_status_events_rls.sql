alter table public.tenant_status_events enable row level security;
create policy "owners read own status events" on public.tenant_status_events for select using (
  exists (select 1 from public.tenants t where t.id = tenant_status_events.tenant_id and t.owner_id = auth.uid())
);
