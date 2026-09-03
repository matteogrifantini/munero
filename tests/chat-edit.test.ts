import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('chat-edit', () => {
  const src = () => fs.readFileSync('app/api/chat-edit/route.ts', 'utf8');
  it('verifies tenant ownership before loading site', () => {
    const s = src();
    expect(s).toContain(`from('tenants')`);
    expect(s).toContain(`eq('owner_id', user.id)`);
    expect(s.indexOf(`from('tenants')`)).toBeLessThan(s.indexOf(`from('site_instances')`));
  });
  it('fail-closed on gemini fetch failure', () => {
    const s = src();
    expect(s).toContain('try {');
    expect(s).toContain('AI non disponibile, riprova.');
    expect(s).toContain('{ blocked: true');
  });
});
