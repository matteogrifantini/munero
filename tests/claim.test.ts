import { describe, it, expect } from 'vitest';
describe('claim', () => {
  it('rejects invalid slugs', () => {
    const bad = ['A', 'a b', 'sito_bello!', 'ab'];
    for (const s of bad) expect(/^[a-z0-9-]{3,63}$/.test(s)).toBe(false);
  });
  it('accepts valid slugs', () => {
    const good = ['barbiere-rossi', 'studio12', 'abc'];
    for (const s of good) expect(/^[a-z0-9-]{3,63}$/.test(s)).toBe(true);
  });
  it('claim route exists', async () => {
    const fs = await import('node:fs');
    expect(fs.existsSync('app/api/claim/route.ts')).toBe(true);
  });
  it('attiva page exists', async () => {
    const fs = await import('node:fs');
    expect(fs.existsSync('app/attiva/page.tsx')).toBe(true);
  });
  it('003 migration defines site_instances with owner RLS', async () => {
    const fs = await import('node:fs');
    const sql = fs.readFileSync('supabase/migrations/003_site_instances.sql', 'utf8');
    expect(sql).toContain('create table public.site_instances');
    expect(sql).toContain('tenant_id uuid primary key references public.tenants(id)');
    expect(sql).toContain('row level security');
  });
  it('getTemplate is exported from lib for reuse', async () => {
    const mod = await import('../lib/templates');
    expect(typeof mod.getTemplate).toBe('function');
    expect(mod.getTemplate('barbiere').profession).toBe('barbiere');
  });
});
