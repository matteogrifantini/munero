// tests/fast-edit.test.ts — zero-token deterministic path, no network
import { describe, it, expect } from 'vitest';
import { tryFastEdit } from '../lib/fast-edit';
const base = { schema_version: 'v1' as const, profession: 'barbiere' as const,
  branding: { name: 'B', primary_color: '#111111', phone: '+39 333 000 0000' },
  hero: { title: 'T', subtitle: 'S' }, services: [{ name: 'Taglio', price: '€ 25' }],
  address: 'Via Roma 1', booking: { type: 'none' } as const, legal: { nome: 'N', ordine: 'O', albo_n: '1', piva: '12345', pec: 'a@pec.it' } };
describe('fast-edit', () => {
  it('updates service price without tokens', () => {
    const r = tryFastEdit(base, 'cambia il prezzo del taglio a 28 euro');
    expect(r.matched).toBe(true);
    expect(r.patch).toMatchObject({ services: [{ name: 'Taglio', price: '€ 28' }] });
  });
  it('updates address without tokens', () => {
    const r = tryFastEdit(base, 'cambia indirizzo in Via Verdi 10, Torino');
    expect(r.matched).toBe(true);
    expect(r.patch).toMatchObject({ address: 'Via Verdi 10, Torino' });
  });
  it('passes through unknown requests to Gemini', () => {
    expect(tryFastEdit(base, 'riscrivi la presentazione in modo più accogliente').matched).toBe(false);
  });
});
