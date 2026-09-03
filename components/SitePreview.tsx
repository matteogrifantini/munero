// components/SitePreview.tsx
import { bookingSection } from '@/lib/booking';
import type { SiteConfig } from '@/lib/site-schema';
export default function SitePreview({ site }: { site: SiteConfig }) {
  const prenota = bookingSection(site);
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ color: site.branding.primary_color }}>{site.hero.title}</h1>
      <p>{site.hero.subtitle}</p>
      <p>{site.branding.name} · {site.branding.phone}</p>
      <h2>Servizi</h2>
      <ul>{site.services.map((s) => (<li key={s.name}>{s.name} — {s.price}</li>))}</ul>
      {prenota.kind !== 'none' && <p><em>Sezione prenotazioni attiva ({prenota.kind}).</em></p>}
      <p>{site.address}</p>
      <footer>{site.legal.nome} · P.IVA {site.legal.piva} · {site.legal.pec}</footer>
    </main>
  );
}
