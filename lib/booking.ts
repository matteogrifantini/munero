// lib/booking.ts
export const BOOKING_URL_RE = /^https:\/\/(cal\.com|cal\.eu)(\/|$)/;
export function isAllowedBookingUrl(u: string): boolean {
  try { return BOOKING_URL_RE.test(u.trim()); } catch { return false; }
}
export function toEmbedUrl(u: string): string {
  const url = u.trim();
  return url.includes('?') ? `${url}&embed` : `${url}?embed`;
}
import type { SiteConfig } from './site-schema';
export type BookingSection =
  | { kind: 'none' }
  | { kind: 'calcom'; embedUrl: string; openUrl: string }
  | { kind: 'whatsapp'; waLink: string };
export function bookingSection(site: SiteConfig): BookingSection {
  const b = site.booking;
  if (b.type === 'calcom') {
    if (!isAllowedBookingUrl(b.url)) return { kind: 'none' };
    return { kind: 'calcom', embedUrl: toEmbedUrl(b.url), openUrl: b.url.trim() };
  }
  if (b.type === 'whatsapp') {
    const digits = b.number.replace(/[^\d]/g, '');
    const text = encodeURIComponent(`Buongiorno ${site.branding.name}, vorrei informazioni.`);
    return { kind: 'whatsapp', waLink: `https://wa.me/${digits}?text=${text}` };
  }
  return { kind: 'none' };
}
