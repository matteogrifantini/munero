create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,63}$'),
  display_name text not null,
  profession text not null default 'generico' check (profession in ('psicologo','barbiere','generico')),
  custom_domain text unique,
  domain_status text not null default 'pending' check (domain_status in ('pending','verifying','active','failed')),
  status text not null default 'active' check (status in ('active','past_due_grace','suspended','deleted')),
  plan text not null default 'senza-dominio' check (plan in ('senza-dominio','con-dominio')),
  created_at timestamptz not null default now()
);
alter table public.tenants enable row level security;
create policy "owners read own tenants" on public.tenants for select using (auth.uid() = owner_id);
create policy "owners insert own tenants" on public.tenants for insert with check (auth.uid() = owner_id);
create policy "owners update own tenants" on public.tenants for update using (auth.uid() = owner_id);
create table public.tenant_status_events (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  old_status text, new_status text, reason text, actor text, at timestamptz default now()
);
