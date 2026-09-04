// tests/chrome.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
const pages = ['app/page.tsx', 'app/catalogo/page.tsx', 'app/dashboard/page.tsx', 'app/chat/page.tsx', 'app/sospeso/page.tsx'];
describe('munero chrome', () => {
  it('pages use brand shell, no raw padding-32 mains remain', () => {
    for (const f of pages) {
      const src = fs.readFileSync(f, 'utf8');
      expect(src).toMatch(/BrandHeader|Container/);
      expect(src).not.toContain('padding: 32');
    }
  });
  it('sospeso stays neutral (no tenant data, munero contact only)', () => {
    const src = fs.readFileSync('app/sospeso/page.tsx', 'utf8');
    expect(src).not.toMatch(/site\.|tenant/i);
    expect(src).toMatch(/sospeso/i);
  });
  it('MButton renders a real <button> for form submits', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const React = (await import('react')).default;
    const { MButton } = await import('../components/ui');
    const html = renderToStaticMarkup(
      React.createElement(MButton, { as: 'button', type: 'submit', children: 'Invia' }),
    );
    expect(html).toMatch(/^<button/);
    expect(html).toContain('type="submit"');
  });
});
