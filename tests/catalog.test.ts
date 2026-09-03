import { describe, it, expect } from 'vitest';
import { siteSchema } from '../lib/site-schema';
import psicologo from '../content/templates/psicologo.json';
import barbiere from '../content/templates/barbiere.json';
describe('catalog', () => {
  it('both seed templates validate against site_schema v1', () => {
    expect(siteSchema.parse(psicologo).profession).toBe('psicologo');
    expect(siteSchema.parse(barbiere).profession).toBe('barbiere');
  });
  it('seed templates carry mandatory legal footer', () => {
    for (const t of [psicologo, barbiere] as any[]) {
      expect(t.legal.nome).toBeTruthy();
      expect(t.legal.piva).toBeTruthy();
    }
  });
});
