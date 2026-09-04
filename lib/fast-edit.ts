// lib/fast-edit.ts — deterministic zero-token slot filling (tried BEFORE any Gemini call)
import type { SiteConfig } from './site-schema';
import { isAllowedBookingUrl } from './booking';
export function tryFastEdit(config: SiteConfig, message: string): { matched: boolean; patch?: Record<string, unknown>; blocked?: string } {
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
  const msgLower = message.toLowerCase();
  if (/prenotaz|booking|appuntament/.test(msgLower)) {
    if (/togli|rimuovi|disattiva|nascondi/.test(msgLower))
      return { matched: true, patch: { booking: { type: 'none' } } };
    const wa = message.match(/whatsapp[^\d+]*(\+?[0-9][0-9 ./-]{5,})/i);
    if (wa) {
      const digits = wa[1].replace(/[^\d]/g, '');
      if (digits.length >= 6) return { matched: true, patch: { booking: { type: 'whatsapp', number: wa[1].trim() } } };
      return { matched: false };
    }
    const url = message.match(/https?:\/\/[^\s)]+/i);
    if (url && isAllowedBookingUrl(url[0]))
      return { matched: true, patch: { booking: { type: 'calcom', url: url[0].trim() } } };
    if (url || /cal\.?com|cal\.?eu/.test(msgLower))
      return { matched: false, blocked: 'URL non valido: sono accettati solo link Cal.com (https://cal.com/… o https://cal.eu/…).' };
    return { matched: false };
  }
  const hours = message.match(/(?:orari|orario)(?: di apertura)?(?: in| a|:)?\s*(.+)/i);
  if (/orar/.test(msgLower) && hours) return { matched: true, patch: { hours: hours[1].trim().slice(0, 200) } };
  return { matched: false };
}
