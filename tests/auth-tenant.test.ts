import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('auth tenant', () => {
  it('migration defines tenants with owner link and statuses', () => {
    const sql = fs.readFileSync('supabase/migrations/001_tenants.sql', 'utf8');
    expect(sql).toContain('create table public.tenants');
    expect(sql).toContain('owner_id uuid references auth.users(id)');
    expect(sql).toContain(`'active','past_due_grace','suspended','deleted'`);
    expect(sql).toContain('row level security');
  });
  it('auth pages exist', () => {
    expect(fs.existsSync('app/(auth)/register/page.tsx')).toBe(true);
    expect(fs.existsSync('app/dashboard/page.tsx')).toBe(true);
  });
});
