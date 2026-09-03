import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTemplate, templateNames, type SiteConfig } from '@/lib/templates';
import { bookingSection } from '@/lib/booking';

export function generateStaticParams() {
  return templateNames.map((template) => ({ template }));
}

export default function DemoPage({ params }: { params: { template: string } }) {
  let site: SiteConfig;
  try {
    site = getTemplate(params.template);
  } catch {
    notFound();
  }
  const prenota = bookingSection(site);
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ color: site.branding.primary_color }}>{site.hero.title}</h1>
      <p>{site.hero.subtitle}</p>
      <p>{site.branding.name} · {site.branding.phone}</p>
      <h2>Servizi</h2>
      <ul>
        {site.services.map((s) => (
          <li key={s.name}>{s.name} — {s.price}</li>
        ))}
      </ul>
      <p>{site.address}</p>
      {prenota.kind === 'calcom' && (
        <section id="prenota">
          <h2>Prenota un appuntamento</h2>
          <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0 }}>
            <iframe src={prenota.embedUrl} title="Prenotazione" loading="lazy" style={{ position: 'absolute', width: '100%', height: '100%', border: 0 }} />
          </div>
          <p>La prenotazione avviene su Cal.com. Munero non memorizza i tuoi dati.</p>
          <p><a href={prenota.openUrl} target="_blank" rel="noreferrer">Apri in una nuova scheda</a></p>
        </section>
      )}
      {prenota.kind === 'whatsapp' && (
        <section id="prenota">
          <h2>Prenota un appuntamento</h2>
          <p><a href={prenota.waLink} target="_blank" rel="noreferrer">Contattaci su WhatsApp</a></p>
        </section>
      )}
      <footer>
        {site.legal.nome} · P.IVA {site.legal.piva} · {site.legal.pec}
      </footer>
      <p>
        <Link href={`/attiva?template=${params.template}`}>Usa questo modello</Link>
      </p>
    </main>
  );
}
