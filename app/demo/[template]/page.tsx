import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTemplate, templateNames, type SiteConfig } from '@/lib/templates';
import SiteView from '@/components/SiteView';

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
    <>
      <SiteView site={site} />
      <p style={{ padding: 32 }}>
        <Link href={`/attiva?template=${params.template}`}>Usa questo modello</Link>
      </p>
    </>
  );
}
