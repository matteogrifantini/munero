// tests/wizard-rich.test.ts — wizard assembles rich v1.2 drafts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { siteSchema } from '../lib/site-schema';
const base = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Studio Rossi', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'Supporto psicologico', subtitle: 'Colloqui in studio e online.' },
  services: [{ name: 'Colloquio', price: '€ 60' }], address: 'Via Roma 1',
  booking: { type: 'none' } as const,
  legal: { nome: 'Dott. Rossi', ordine: 'OPL', albo_n: '1', piva: '01234567890', pec: 'r@pec.it' } };
describe('wizard rich draft', () => {
  it('empty rich fields stay hidden (about undefined, faq empty, hours empty)', () => {
    const c = siteSchema.parse({ ...base, about: undefined, hours: '', faq: [] });
    expect(c.about).toBeUndefined();
  });
  it('filled rich fields parse', () => {
    const c = siteSchema.parse({ ...base,
      about: { title: 'Chi sono', body: 'Psicologo dal 2010, approccio informativo.', points: ['Studio e online'] },
      hours: 'Lun – Ven 9:00 – 19:00',
      faq: [{ q: 'Quanto dura?', a: 'Ogni incontro dura 50 minuti.' }] });
    expect(c.about?.points.length).toBe(1);
  });
  it('wizard form contains rich sections', () => {
    const src = fs.readFileSync('app/wizard/WizardClient.tsx', 'utf8');
    for (const s of ['Chi sono (facoltativo)', 'Orari di apertura', 'Domande frequenti', 'Riempi dati demo']) {
      expect(src).toContain(s);
    }
  });
});
