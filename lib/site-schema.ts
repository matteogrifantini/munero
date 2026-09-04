import { z } from 'zod';
export const siteSchema = z.object({
  schema_version: z.literal('v1'),
  profession: z.enum(['psicologo', 'barbiere', 'generico']),
  branding: z.object({ name: z.string().min(2), primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/), phone: z.string().min(5) }),
  hero: z.object({ title: z.string().min(3).max(90), subtitle: z.string().max(220) }),
  services: z.array(z.object({ name: z.string().min(2), price: z.string().min(1) })).max(12),
  address: z.string().min(4),
  legal: z.object({ nome: z.string().min(3), ordine: z.string().min(1), albo_n: z.string().min(1), piva: z.string().min(5), pec: z.string().email() }),
  booking: z.union([
    z.object({ type: z.literal('none') }),
    z.object({ type: z.literal('calcom'),
      url: z.string().url().refine(
        (u) => /^https:\/\/(cal\.com|cal\.eu)(\/|$)/.test(u),
        'Solo URL Cal.com (cal.com / cal.eu)') }),
    z.object({ type: z.literal('whatsapp'),
      number: z.string().regex(/^\+?[0-9 ]{6,20}$/) }),
  ]).default({ type: 'none' }),
  about: z.object({
    title: z.string().min(3).max(60),
    body: z.string().min(10).max(1200),
    points: z.array(z.string().min(2).max(120)).max(6),
  }).optional(),
  faq: z.array(z.object({ q: z.string().min(3).max(140), a: z.string().min(10).max(600) })).max(8).default([]),
  hours: z.string().max(200).default(''),
});
export type SiteConfig = z.infer<typeof siteSchema>;
