create table public.site_instances (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_instances enable row level security;
create policy "owners read own site" on public.site_instances for select using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()));
create policy "owners write own site" on public.site_instances for all using (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()))
  with check (
  exists (select 1 from public.tenants t where t.id = tenant_id and t.owner_id = auth.uid()));
