// tests/wizard.test.ts
import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import fs from 'node:fs';
const draft = { schema_version: 'v1' as const, profession: 'psicologo' as const,
  branding: { name: 'Studio Rossi', primary_color: '#2f5d50', phone: '+39 333 000 0000' },
  hero: { title: 'Supporto psicologico', subtitle: 'Colloqui in studio e online.' },
  services: [{ name: 'Colloquio individuale (50 min)', price: '€ 60' }],
  address: 'Via Roma 1, Milano', booking: { type: 'none' } as const,
  legal: { nome: 'Dott. Mario Rossi', ordine: 'OPL', albo_n: '12345', piva: '01234567890', pec: 'm.rossi@pec.it' } };
describe('wizard draft', () => {
  it('assembles a valid SiteConfig', () => {
    expect(siteSchema.safeParse(draft).success).toBe(true);
  });
  it('barbiere legal uses em-dash ordine/albo', () => {
    const b = { ...draft, profession: 'barbiere' as const,
      legal: { nome: 'Bottega B', ordine: '—', albo_n: '—', piva: '09876543210', pec: 'b@pec.it' } };
    expect(siteSchema.safeParse(b).success).toBe(true);
  });
  it('wizard files exist', () => {
    expect(fs.existsSync('app/wizard/page.tsx')).toBe(true);
    expect(fs.existsSync('app/wizard/WizardClient.tsx')).toBe(true);
    expect(fs.existsSync('components/SitePreview.tsx')).toBe(true);
  });
});
