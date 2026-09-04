import Link from 'next/link';
import { getTemplate, listRoles, templateNames } from '@/lib/templates';
import SiteView from '@/components/SiteView';
import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

const templates = templateNames.map((slug) => ({ slug, data: getTemplate(slug) }));
const roles = listRoles();

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container size="wide">
        <div className="py-10">
          <SectionTitle
            eyebrow="Catalogo"
            title="Catalogo modelli"
            description="Scegli un modello, guardalo in anteprima e crea il tuo sito con la procedura guidata."
          />
          {roles.map((r) => (
            <section key={r.role} className="mb-10">
              <h2 className="font-display text-2xl capitalize text-stone-900">{r.role}</h2>
              <p className="mt-1 text-sm text-stone-600">{r.blurb}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {r.variants.map((v) => (
                  <Card key={v.key}>
                    <h3 className="font-display text-xl text-stone-900">{v.name}</h3>
                    <p className="mt-2 text-sm text-stone-600">{v.blurb}</p>
                    <div className="h-64 overflow-hidden rounded-xl border" aria-hidden="true">
                      <div className="pointer-events-none origin-top-left" style={{ transform: 'scale(0.4)', width: '250%' }}>
                        <SiteView site={getTemplate(r.role)} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/demo/${r.role}`}
                        className="text-sm font-medium text-stone-900 underline underline-offset-4"
                      >
                        Vedi demo: {templates.find((t) => t.slug === r.role)?.data.branding.name ?? r.role} —{' '}
                        {templates.find((t) => t.slug === r.role)?.data.hero.title}
                      </Link>
                      <MButton href="/wizard" variant="ghost">
                        Usa {v.name}
                      </MButton>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
          <MButton href="/wizard">Crea il tuo sito con la procedura guidata</MButton>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
