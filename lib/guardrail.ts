const BANNED = [/scont[oi]/i, /offert[ae]/i, /promozione/i, /%\s*(di\s*sconto)?/i, /miglior/i, /garantit/i, /prima\s*\/\s*dopo/i, /recension/i];
export function checkDeontology(text: string): { blocked: boolean; reason?: string } {
  for (const rx of BANNED) if (rx.test(text)) return { blocked: true, reason: `Contenuto non consentito per professionisti sanitari (Legge 145/2018): pattern ${rx.source}` };
  return { blocked: false };
}
