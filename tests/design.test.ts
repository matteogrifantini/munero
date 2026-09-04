import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('design system', () => {
  it('layout loads fonts and shell components exist', () => {
    const layout = fs.readFileSync('app/layout.tsx', 'utf8');
    expect(layout).toMatch(/next\/font/);
    expect(layout).toMatch(/Playfair Display|playfair/i);
    expect(fs.existsSync('components/ui.tsx')).toBe(true);
  });
  it('v4 theme tokens live in globals.css with heroui styles', () => {
    const css = fs.readFileSync('app/globals.css', 'utf8');
    expect(css.indexOf('@import "tailwindcss"')).toBeLessThan(css.indexOf('@import "@heroui/styles"'));
    expect(css).toContain('@theme');
    expect(css).toMatch(/--color-brand/);
    expect(css).toMatch(/--font-display/);
  });
  it('ui exports all shell primitives', () => {
    const src = fs.readFileSync('components/ui.tsx', 'utf8');
    for (const n of ['Container', 'MButton', 'Card', 'SectionTitle', 'Field', 'BrandHeader', 'BrandFooter']) {
      expect(src).toContain(n);
    }
  });
});
