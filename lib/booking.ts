// lib/booking.ts
export const BOOKING_URL_RE = /^https:\/\/(cal\.com|cal\.eu)(\/|$)/;
export function isAllowedBookingUrl(u: string): boolean {
  try { return BOOKING_URL_RE.test(u.trim()); } catch { return false; }
}
export function toEmbedUrl(u: string): string {
  const url = u.trim();
  return url.includes('?') ? `${url}&embed` : `${url}?embed`;
}
