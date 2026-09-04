import { notFound } from 'next/navigation';
import { getTemplate, templateNames, type SiteConfig } from '@/lib/templates';
import SiteView from '@/components/SiteView';
import { Container, MButton } from '@/components/ui';

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
      <Container>
        <div className="py-8">
          <MButton href={`/attiva?template=${params.template}`}>Usa questo modello</MButton>
        </div>
      </Container>
    </>
  );
}
