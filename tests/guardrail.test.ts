import { describe, it, expect } from 'vitest';
import { checkDeontology } from '../lib/guardrail';
describe('guardrail', () => {
  it('blocks discounts and superlatives (Legge 145/2018)', () => {
    expect(checkDeontology('Offerta speciale: sconto 20% solo oggi!').blocked).toBe(true);
    expect(checkDeontology('Il miglior psicologo di Milano, risultati garantiti').blocked).toBe(true);
  });
  it('allows informative price/address edits', () => {
    expect(checkDeontology('Aggiorna il prezzo del taglio a 28 euro').blocked).toBe(false);
    expect(checkDeontology('Cambia indirizzo in Via Verdi 10').blocked).toBe(false);
  });
});
