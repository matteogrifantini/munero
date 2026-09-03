import { siteSchema, type SiteConfig } from './site-schema';
import psicologo from '../content/templates/psicologo.json';
import barbiere from '../content/templates/barbiere.json';

const registry: Record<string, unknown> = { psicologo, barbiere };

export const templateNames = Object.keys(registry);

export type { SiteConfig };

export function getTemplate(name: string): SiteConfig {
  const raw = registry[name];
  if (!raw) throw new Error(`unknown template: ${name}`);
  return siteSchema.parse(raw);
}
