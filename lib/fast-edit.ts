// lib/fast-edit.ts — deterministic zero-token slot filling (tried BEFORE any Gemini call)
import type { SiteConfig } from './site-schema';
export function tryFastEdit(config: SiteConfig, message: string): { matched: boolean; patch?: Record<string, unknown> } {
  const msg = message.toLowerCase();
  const price = msg.match(/(prezzo (?:del|della|di) )?(.+?) a (\d{1,4})\s*€?/) ?? msg.match(/(.+?) a (\d{1,4})\s*euro/);
  if (/prezz/.test(msg) && price) {
    const serviceName = (price[2] ?? '').trim();
    const amount = price[3] ?? price[2];
    const services = config.services.map(s =>
      s.name.toLowerCase().includes(serviceName) || serviceName.includes(s.name.toLowerCase().split(' ')[0])
        ? { ...s, price: `€ ${amount}` } : s);
    if (services.some((s, i) => s.price !== config.services[i].price)) return { matched: true, patch: { services } };
  }
  const addr = message.match(/indirizzo in (.+)/i);
  if (/indirizzo/.test(msg) && addr) return { matched: true, patch: { address: addr[1].trim() } };
  const phone = message.match(/(?:telefono|cellulare)(?: a| in|:)?\s*(\+?[0-9][0-9 ./-]{5,})/i);
  if (phone) return { matched: true, patch: { branding: { ...config.branding, phone: phone[1].trim() } } };
  return { matched: false };
}
