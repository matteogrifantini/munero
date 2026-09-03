import { siteSchema, type SiteConfig } from './site-schema';
import psicologo from '../content/templates/psicologo.json';
import barbiere from '../content/templates/barbiere.json';

const base: Record<string, unknown> = { psicologo, barbiere };
const registry: Record<string, unknown> = {
  ...base,
  'psicologo.essenziale': psicologo,
  'barbiere.essenziale': barbiere,
};

export const templateNames = Object.keys(base);

export type { SiteConfig };

export function getTemplate(name: string): SiteConfig {
  const raw = registry[name];
  if (!raw) throw new Error(`unknown template: ${name}`);
  return siteSchema.parse(raw);
}

const ROLE_META: Record<string, { blurb: string; variants: { key: string; name: string; blurb: string }[] }> = {
  psicologo: { blurb: 'Siti per psicologi e psicoterapeuti: servizi, prezzi trasparenti e prenotazioni.',
    variants: [{ key: 'psicologo.essenziale', name: 'Essenziale', blurb: 'Una pagina: servizi, prenota, contatti, dati legali.' }] },
  barbiere: { blurb: 'Siti per barbieri e saloni: servizi, prezzi e prenotazioni.',
    variants: [{ key: 'barbiere.essenziale', name: 'Essenziale', blurb: 'Una pagina: servizi, prenota, contatti, dati legali.' }] },
};
export function listRoles() {
  return Object.keys(ROLE_META).map((role) => ({ role, ...ROLE_META[role] }));
}
