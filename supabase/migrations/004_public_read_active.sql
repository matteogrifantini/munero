-- Scoped public read for the unauthenticated tenant renderer (/t/[slug]).
-- Anon (no session) may read active tenants only; blocked statuses stay invisible
-- (no row returned => middleware + page guard fail-closed to /sospeso).
-- Owner policies in 001/003 are untouched.
create policy "public read active tenants" on public.tenants
  for select to anon
  using (status in ('active','past_due_grace'));

create policy "public read active site" on public.site_instances
  for select to anon
  using (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and t.status in ('active','past_due_grace')
    )
  );
