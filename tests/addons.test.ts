// tests/addons.test.ts — dashboard upsell section (static, informative-only)
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('addons upsell', () => {
  it('dashboard lists dominio, email, gestionale with contact CTA', () => {
    const src = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
    expect(src).toContain('Servizi aggiuntivi');
    for (const s of ['Dominio personalizzato', 'Email professionale', 'Gestionale appuntamenti']) {
      expect(src).toContain(s);
    }
    expect(src).toContain('mailto:info@munero.it');
    expect(src).not.toMatch(/stripe|checkout|pagamento|paypal/i);
  });
});
