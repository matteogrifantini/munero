import Link from 'next/link';
import { siteSchema } from '@/lib/site-schema';
import psicologo from '@/content/templates/psicologo.json';
import barbiere from '@/content/templates/barbiere.json';

const templates = [
  { slug: 'psicologo', data: siteSchema.parse(psicologo) },
  { slug: 'barbiere', data: siteSchema.parse(barbiere) },
];

export default function CatalogoPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Catalogo modelli</h1>
      <ul>
        {templates.map((t) => (
          <li key={t.slug}>
            <Link href={`/demo/${t.slug}`}>{t.data.branding.name} — {t.data.hero.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
