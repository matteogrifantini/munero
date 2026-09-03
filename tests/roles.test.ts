// tests/roles.test.ts
import { describe, it, expect } from 'vitest';
import { getTemplate, listRoles, templateNames } from '../lib/templates';
describe('roles registry', () => {
  it('lists psicologo and barbiere with essenziale variant', () => {
    const roles = listRoles();
    expect(roles.map(r => r.role).sort()).toEqual(['barbiere', 'psicologo']);
    for (const r of roles) {
      expect(r.variants.length).toBeGreaterThanOrEqual(1);
      expect(r.variants[0].key).toBe(`${r.role}.essenziale`);
    }
  });
  it('legacy alias still works', () => {
    expect(getTemplate('psicologo').profession).toBe('psicologo');
    expect(getTemplate('psicologo.essenziale').branding.name)
      .toBe(getTemplate('psicologo').branding.name);
  });
  it('unknown key throws', () => {
    expect(() => getTemplate('psicologo.deluxe')).toThrow();
    expect(() => getTemplate('generico.essenziale')).toThrow();
  });
  it('legacy templateNames unchanged', () => {
    expect([...templateNames].sort()).toEqual(['barbiere', 'psicologo']);
  });
});
