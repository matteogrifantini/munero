// tests/showcase.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('showcase', () => {
  it('catalog renders live mini previews', () => {
    const src = fs.readFileSync('app/catalogo/page.tsx', 'utf8');
    expect(src).toContain('SiteView');
    expect(src).toMatch(/scale\(|transform/);
    expect(src).toContain('pointer-events-none');
  });
  it('wizard has demo prefill and dashboard has demo-site creation', () => {
    const w = fs.readFileSync('app/wizard/WizardClient.tsx', 'utf8');
    expect(w).toMatch(/Riempi dati demo/i);
    const d = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
    expect(d).toMatch(/api\/create-site/);
    expect(d).toMatch(/demo-/i);
  });
});
