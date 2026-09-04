// tests/ux.test.ts — guided UX: chat chips, slug preview, footer credit
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('guided ux', () => {
  it('chat offers zero-token example prompts', () => {
    const src = fs.readFileSync('app/chat/page.tsx', 'utf8');
    expect(src).toContain('cambia il prezzo del taglio a 28 euro');
    expect(src).toContain('cambia indirizzo in Via Verdi 10, Torino');
    expect(src).toContain('setMessage(s)');
  });
  it('wizard previews the final site address live', () => {
    const src = fs.readFileSync('app/wizard/WizardClient.tsx', 'utf8');
    expect(src).toContain('Il tuo sito sarà:');
    expect(src).toContain('.munero.it');
  });
  it('tenant footer carries neutral munero credit', () => {
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    expect(src).toContain('Realizzato con Munero');
    expect(src).not.toMatch(/sconto|offerta|promo/i);
  });
});
