create table public.sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template text not null default 'generico' check (template in ('psicologo','barbiere','generico')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy "owners read own sites" on public.sites for select using (
  exists (select 1 from public.tenants t where t.id = sites.tenant_id and t.owner_id = auth.uid())
);
create policy "owners insert own sites" on public.sites for insert with check (
  exists (select 1 from public.tenants t where t.id = sites.tenant_id and t.owner_id = auth.uid())
);
create policy "owners update own sites" on public.sites for update using (
  exists (select 1 from public.tenants t where t.id = sites.tenant_id and t.owner_id = auth.uid())
);
