import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import DemoSiteButton from '@/components/DemoSiteButton';
import psicologoTemplate from '@/content/templates/psicologo.json';
import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

export default async function Dashboard() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f4]">
        <BrandHeader />
        <Container>
          <div className="py-10">
            <Card>
              <p className="text-sm text-stone-700">
                Devi <Link href="/login" className="font-medium underline underline-offset-4">accedere</Link>.
              </p>
            </Card>
          </div>
        </Container>
        <BrandFooter />
      </div>
    );
  }
  const { data } = await sb.from('tenants').select('slug,display_name,status,plan').eq('owner_id', user.id);
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container size="wide">
        <div className="py-10">
          <SectionTitle eyebrow="Dashboard" title="I tuoi siti" />
          <div className="mb-6 flex flex-wrap gap-3">
            <MButton href="/catalogo" variant="ghost">
              Scegli un sito demo
            </MButton>
            <MButton href="/chat" variant="ghost">
              Modifica con la chat AI
            </MButton>
            <MButton href="/wizard">Crea sito guidato</MButton>
            <DemoSiteButton endpoint="/api/create-site" slugPrefix="demo-" config={psicologoTemplate} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(data ?? []).map((t) => (
              <Card key={t.slug}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl text-stone-900">{t.display_name}</h2>
                    <Link href={`/t/${t.slug}`} className="text-sm text-stone-600 underline underline-offset-4">
                      {t.slug}
                    </Link>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                    {t.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-stone-600">{t.plan}</p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
