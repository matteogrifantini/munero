// tests/rich.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import { tryFastEdit } from '../lib/fast-edit';
import fs from 'node:fs';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'SS', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'TTT', subtitle: 'S' }, services: [{ name: 'Colloquio', price: '€ 60' }],
  address: 'Via Roma 1', booking: { type: 'none' } as const,
  legal: { nome: 'NNN', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'e@pec.it' } };
describe('rich schema', () => {
  it('old configs parse with empty rich sections', () => {
    const c = siteSchema.parse(base);
    expect(c.faq).toEqual([]);
    expect(c.hours).toBe('');
    expect(c.about).toBeUndefined();
  });
  it('accepts full rich payload', () => {
    const c = siteSchema.parse({ ...base,
      about: { title: 'Chi sono', body: 'Psicologa dal 2010.', points: ['Iscritta OPL', 'EMDR'] },
      faq: [{ q: 'Quanto dura?', a: '50 minuti.' }],
      hours: 'Lun–Ven 9–19' });
    expect(c.faq?.length).toBe(1);
  });
  it('rejects oversized faq', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ q: `Q${i}`, a: 'Risposta lunga abbastanza.' }));
    expect(siteSchema.safeParse({ ...base, faq: many }).success).toBe(false);
  });
  it('fast-edit updates hours with zero tokens', () => {
    const r = tryFastEdit({ ...base, faq: [], hours: '' }, 'cambia orari in Lun Ven 9 19');
    expect(r.matched).toBe(true);
    expect(r.patch).toMatchObject({ hours: expect.stringContaining('Lun') });
  });
  it('siteview renders about/faq/hours sections', () => {
    const src = fs.readFileSync('components/SiteView.tsx', 'utf8');
    for (const s of ['about', 'faq', 'hours', '<details']) expect(src).toContain(s);
  });
});
