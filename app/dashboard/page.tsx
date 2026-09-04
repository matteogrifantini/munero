import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import DemoSiteButton from '@/components/DemoSiteButton';
import psicologoTemplate from '@/content/templates/psicologo.json';
import type { SiteConfig } from '@/lib/site-schema';
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
          <p className="mb-4 text-sm text-stone-600">
            Hai {(data ?? []).length} siti ({(data ?? []).filter((t) => t.status !== 'active').length} sospesi)
          </p>
          <div className="mb-6 flex flex-wrap gap-3">
            <MButton href="/catalogo" variant="ghost">
              Scegli un sito demo
            </MButton>
            <MButton href="/chat" variant="ghost">
              Modifica con la chat AI
            </MButton>
            <MButton href="/wizard">Crea sito guidato</MButton>
            <DemoSiteButton endpoint="/api/create-site" slugPrefix="demo-" config={psicologoTemplate as SiteConfig} />
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
          {(!data || data.length === 0) && (
            <Card>
              <p className="text-sm text-stone-700">Non hai ancora nessun sito. Parti dal catalogo o dalla procedura guidata: in pochi minuti sei online.</p>
              <p className="mt-3"><MButton href="/wizard">Crea il tuo primo sito</MButton></p>
            </Card>
          )}
          <div className="mt-10">
            <SectionTitle eyebrow="Servizi aggiuntivi" title="Fai crescere il tuo sito" description="Dominio, email e gestionale si attivano su richiesta, senza pensieri tecnici." />
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <h3 className="font-display text-xl text-stone-900">Dominio personalizzato</h3>
                <p className="mt-2 text-sm text-stone-600">Il tuo www.nome.it al posto di slug.munero.it. Una tantum di attivazione + canone mensile.</p>
                <p className="mt-3"><a href="mailto:info@munero.it?subject=Richiesta%20dominio%20personalizzato" className="text-sm font-medium underline underline-offset-4">Richiedi il dominio</a></p>
              </Card>
              <Card>
                <h3 className="font-display text-xl text-stone-900">Email professionale</h3>
                <p className="mt-2 text-sm text-stone-600">Caselle nome@cognome.it collegate al tuo dominio, configurate per te.</p>
                <p className="mt-3"><a href="mailto:info@munero.it?subject=Richiesta%20email%20professionale" className="text-sm font-medium underline underline-offset-4">Richiedi le email</a></p>
              </Card>
              <Card>
                <h3 className="font-display text-xl text-stone-900">Gestionale appuntamenti</h3>
                <p className="mt-2 text-sm text-stone-600">Agenda avanzata oltre Cal.com: promemoria, anagrafiche clienti e statistiche.</p>
                <p className="mt-3"><a href="mailto:info@munero.it?subject=Richiesta%20gestionale%20appuntamenti" className="text-sm font-medium underline underline-offset-4">Richiedi il gestionale</a></p>
              </Card>
            </div>
          </div>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
