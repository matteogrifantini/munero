import Link from 'next/link';
import { getTemplate, templateNames } from '@/lib/templates';

const templates = templateNames.map((slug) => ({ slug, data: getTemplate(slug) }));

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
      <p><Link href="/wizard">Crea il tuo sito con la procedura guidata</Link></p>
    </main>
  );
}
