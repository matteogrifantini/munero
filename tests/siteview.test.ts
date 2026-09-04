import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('siteview', () => {
  it('shared renderer exists with accent theming and required sections', () => {
    expect(fs.existsSync('components/SiteView.tsx')).toBe(true);
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    expect(src).toContain('--accent');
    for (const s of ['Servizi', 'prenota', 'P.IVA', 'Cal.com']) expect(src).toContain(s);
  });
  it('all three surfaces use the shared renderer', () => {
    for (const f of ['app/t/[slug]/page.tsx', 'app/demo/[template]/page.tsx', 'app/wizard/WizardClient.tsx']) {
      expect(fs.readFileSync(f, 'utf8')).toContain('SiteView');
    }
  });
  it('siteview uses heroui primitives', () => {
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    expect(src).toMatch(/@heroui\/react/);
    expect(src).toContain('--accent');
  });
});
