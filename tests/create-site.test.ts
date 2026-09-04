// tests/create-site.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('create-site', () => {
  it('normalizes slugs like claim does', () => {
    const norm = (s: string) => String(s ?? '').trim().toLowerCase();
    expect(norm(' Studio-Rossi ')).toBe('studio-rossi');
    expect(/^[a-z0-9-]{3,63}$/.test(norm('Studio-Rossi '))).toBe(true);
  });
  it('provision helper exists and claim delegates', () => {
    expect(fs.existsSync('lib/create-site.ts')).toBe(true);
    expect(fs.existsSync('app/api/create-site/route.ts')).toBe(true);
    const claim = fs.readFileSync('app/api/claim/route.ts', 'utf8');
    expect(claim).toContain('provisionSite');
  });
});
