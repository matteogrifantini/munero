// tests/booking.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import { isAllowedBookingUrl, toEmbedUrl } from '../lib/booking';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Dott.ssa E', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'Supporto psicologico', subtitle: 'Colloqui in studio e online.' },
  services: [{ name: 'Colloquio individuale (50 min)', price: '€ 60' }],
  address: 'Via Roma 1, Milano',
  legal: { nome: 'Dott.ssa E', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('booking schema v1.1', () => {
  it('defaults missing booking to none (backwards compatible)', () => {
    expect(siteSchema.parse(base).booking).toEqual({ type: 'none' });
  });
  it('accepts calcom url', () => {
    const c = siteSchema.parse({ ...base, booking: { type: 'calcom', url: 'https://cal.com/veronica/colloquio' } });
    expect(c.booking).toEqual({ type: 'calcom', url: 'https://cal.com/veronica/colloquio' });
  });
  it('rejects non-cal urls', () => {
    expect(siteSchema.safeParse({ ...base, booking: { type: 'calcom', url: 'https://evil.com/x' } }).success).toBe(false);
    expect(siteSchema.safeParse({ ...base, booking: { type: 'calcom', url: 'https://cal.com.evil.it/x' } }).success).toBe(false);
  });
  it('accepts whatsapp, rejects bad number', () => {
    expect(siteSchema.parse({ ...base, booking: { type: 'whatsapp', number: '+39 333 000 0000' } }).booking.type).toBe('whatsapp');
    expect(siteSchema.safeParse({ ...base, booking: { type: 'whatsapp', number: 'abc' } }).success).toBe(false);
  });
});
describe('allowlist', () => {
  it('accepts cal.com / cal.eu subpaths, rejects rest', () => {
    expect(isAllowedBookingUrl('https://cal.com/u/e')).toBe(true);
    expect(isAllowedBookingUrl('https://cal.eu/u/e')).toBe(true);
    expect(isAllowedBookingUrl('http://cal.com/u')).toBe(false);
    expect(isAllowedBookingUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedBookingUrl('https://evil-cal.com/u')).toBe(false);
  });
  it('builds embed url', () => {
    expect(toEmbedUrl('https://cal.com/u/e')).toBe('https://cal.com/u/e?embed');
  });
});
