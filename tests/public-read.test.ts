import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('public read active', () => {
  it('004 grants anon SELECT on active tenants and their site only', () => {
    const sql = fs.readFileSync('supabase/migrations/004_public_read_active.sql', 'utf8');
    expect(sql).toContain('public read active tenants');
    expect(sql).toContain('public read active site');
    expect(sql).toContain('for select to anon');
    expect(sql).toContain(`status in ('active','past_due_grace')`);
    expect(sql).toContain('public.tenants t');
    // Blocked statuses must stay invisible to anon: no permissive grant for them.
    expect(sql).not.toContain('suspended');
    expect(sql).not.toContain('deleted');
  });
});
