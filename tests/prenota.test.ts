// tests/prenota.test.ts
import { describe, it, expect } from 'vitest';
import { bookingSection } from '../lib/booking';
import { tryFastEdit } from '../lib/fast-edit';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Dott.ssa E', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'T', subtitle: 'S' }, services: [{ name: 'Colloquio', price: '€ 60' }],
  address: 'Via Roma 1, Milano', booking: { type: 'none' } as const,
  legal: { nome: 'N', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('bookingSection', () => {
  it('hides on none', () => { expect(bookingSection(base)).toEqual({ kind: 'none' }); });
  it('builds calcom embed props', () => {
    const r = bookingSection({ ...base, booking: { type: 'calcom', url: 'https://cal.com/v/e' } });
    expect(r).toEqual({ kind: 'calcom', embedUrl: 'https://cal.com/v/e?embed', openUrl: 'https://cal.com/v/e' });
  });
  it('fail-closed on non-allowlisted url', () => {
    const r = bookingSection({ ...base, booking: { type: 'calcom', url: 'https://evil.com/x' } as never });
    expect(r).toEqual({ kind: 'none' });
  });
  it('builds whatsapp link without health prefill', () => {
    const r = bookingSection({ ...base, booking: { type: 'whatsapp', number: '+39 333 000 0000' } });
    expect(r.kind).toBe('whatsapp');
    if (r.kind === 'whatsapp') {
      expect(r.waLink.startsWith('https://wa.me/393330000000')).toBe(true);
      expect(r.waLink).not.toMatch(/ansia|colloquio|psicolog/i);
    }
  });
});
describe('fast-edit booking intents', () => {
  it('sets calcom url with zero tokens', () => {
    const r = tryFastEdit(base, 'imposta prenotazioni cal.com https://cal.com/veronica/colloquio');
    expect(r.matched).toBe(true);
    expect(r.patch).toEqual({ booking: { type: 'calcom', url: 'https://cal.com/veronica/colloquio' } });
  });
  it('blocks invalid url without gemini', () => {
    const r = tryFastEdit(base, 'imposta prenotazioni https://evil.com/x');
    expect(r.matched).toBe(false);
    expect(r.blocked).toMatch(/cal\.com/i);
  });
  it('removes booking', () => {
    const r = tryFastEdit(base, 'togli le prenotazioni dal sito');
    expect(r).toMatchObject({ matched: true, patch: { booking: { type: 'none' } } });
  });
  it('sets whatsapp', () => {
    const r = tryFastEdit(base, 'prenotazioni solo whatsapp +39 333 111 1111');
    expect(r).toMatchObject({ matched: true, patch: { booking: { type: 'whatsapp', number: '+39 333 111 1111' } } });
  });
});
