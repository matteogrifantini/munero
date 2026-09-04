import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('design system', () => {
  it('layout loads fonts and shell components exist', () => {
    const layout = fs.readFileSync('app/layout.tsx', 'utf8');
    expect(layout).toMatch(/next\/font/);
    expect(layout).toMatch(/Playfair Display|playfair/i);
    expect(fs.existsSync('components/ui.tsx')).toBe(true);
  });
  it('theme exposes accent variable and brand colors', () => {
    const css = fs.readFileSync('app/globals.css', 'utf8');
    expect(css).toContain('--accent');
    const tw = fs.readFileSync('tailwind.config.ts', 'utf8');
    expect(tw).toMatch(/brand|1e3d2b/i);
  });
  it('ui exports all shell primitives', () => {
    const src = fs.readFileSync('components/ui.tsx', 'utf8');
    for (const n of ['Container', 'MButton', 'Card', 'SectionTitle', 'Field', 'BrandHeader', 'BrandFooter']) {
      expect(src).toContain(n);
    }
  });
});
