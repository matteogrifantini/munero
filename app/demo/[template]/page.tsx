import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTemplate, templateNames, type SiteConfig } from '@/lib/templates';

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
      <footer>
        {site.legal.nome} · P.IVA {site.legal.piva} · {site.legal.pec}
      </footer>
      <p>
        <Link href={`/attiva?template=${params.template}`}>Usa questo modello</Link>
      </p>
    </main>
  );
}
