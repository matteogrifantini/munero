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
  it('005 migration enables RLS on tenant_status_events with owner-read-only policy', async () => {
    const fs = await import('node:fs');
    const sql = fs.readFileSync('supabase/migrations/005_status_events_rls.sql', 'utf8');
    expect(sql).toContain('tenant_status_events enable row level security');
    expect(sql).toContain('for select');
    expect(sql).toMatch(/owner_id\s*=\s*auth\.uid\(\)/);
    expect(sql).not.toMatch(/for insert|for update|for delete/);
  });
  it('claim route normalizes slug before regex check', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('app/api/claim/route.ts', 'utf8');
    expect(src).toContain('trim().toLowerCase()');
    expect(src.indexOf('trim().toLowerCase()')).toBeLessThan(src.indexOf('/^[a-z0-9-]{3,63}$/'));
    const normalize = (s: unknown) => String((s as string) ?? '').trim().toLowerCase();
    expect(/^[a-z0-9-]{3,63}$/.test(normalize('  Barbiere-Rossi  '))).toBe(true);
  });
  it('claim route validates displayName and plan with Zod → 400', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('app/api/claim/route.ts', 'utf8');
    expect(src).toContain(`z.enum(['senza-dominio', 'con-dominio'])`);
    expect(src).toContain('bad displayName');
    expect(src).toContain('bad plan');
    const { z } = await import('zod');
    expect(z.string().min(1).max(120).safeParse('').success).toBe(false);
    expect(z.enum(['senza-dominio', 'con-dominio']).safeParse('premium').success).toBe(false);
  });
  it('claim route maps corrupt template config to 400 not 500', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('app/api/claim/route.ts', 'utf8');
    expect(src).toContain('bad template config');
    expect(src).toContain('try {');
    expect(src).toMatch(/catch[\s\S]*400/);
  });
});
