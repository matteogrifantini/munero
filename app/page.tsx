import Link from 'next/link';
import SiteView from '@/components/SiteView';
import { getTemplate, listRoles } from '@/lib/templates';
import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

const mockup = getTemplate('psicologo');
const roles = listRoles();

const faqs = [
  {
    q: 'Serve il dominio per iniziare?',
    a: 'No. Il tuo sito nasce subito su slug.munero.it. Il dominio personalizzato si aggiunge dopo, su richiesta.',
  },
  {
    q: 'Chi scrive i testi del sito?',
    a: 'Tu, con la procedura guidata: inserisci servizi, prezzi e contatti partendo dal modello del tuo ruolo. Poi modifichi tutto via chat.',
  },
  {
    q: 'E se disdico?',
    a: 'Il sito viene sospeso e non è più visibile online. Scrivici e lo riattiviamo o esportiamo i tuoi contenuti.',
  },
  {
    q: 'I miei dati come sono trattati?',
    a: 'Usiamo i tuoi dati solo per far funzionare il sito. Niente rivendita, niente profilazione pubblicitaria.',
  },
  {
    q: 'Va bene per professionisti sanitari?',
    a: 'Sì: i modelli includono pagine con dati legali e partita IVA, ma i testi restano tua responsabilità professionale.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container size="wide">
        <section className="grid items-center gap-8 py-16 sm:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">
              Il sito del tuo studio, senza pensieri
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600 lg:mx-0">
              Un sito professionale per la tua attività: lo crei in pochi minuti e lo aggiorni con una chat.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <MButton href="/wizard">Crea il tuo sito</MButton>
              <MButton href="/catalogo" variant="ghost">
                Vedi i siti demo
              </MButton>
            </div>
            <p className="mt-4 text-sm text-stone-600">
              <Link href="/wizard" className="font-medium underline underline-offset-4">
                Inizia dalla procedura guidata
              </Link>
            </p>
          </div>
          <div className="h-96 overflow-hidden rounded-2xl border bg-white shadow-sm" aria-hidden="true">
            <div className="pointer-events-none origin-top-left" style={{ transform: 'scale(0.45)', width: '222%' }}>
              <SiteView site={mockup} />
            </div>
          </div>
        </section>

        <section className="mt-4">
          <SectionTitle
            eyebrow="Come funziona"
            title="Come funziona"
            description="Tre passi, senza competenze tecniche."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Passo 1</p>
              <h3 className="mt-1 font-display text-xl text-stone-900">Scegli il modello</h3>
              <p className="mt-2 text-sm text-stone-600">
                Parti dal modello del tuo ruolo: servizi, prezzi e contatti già impaginati.
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Passo 2</p>
              <h3 className="mt-1 font-display text-xl text-stone-900">Inserisci le info</h3>
              <p className="mt-2 text-sm text-stone-600">
                La procedura guidata ti chiede nome, servizi e contatti: in pochi minuti sei online.
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Passo 3</p>
              <h3 className="mt-1 font-display text-xl text-stone-900">Modifica via chat</h3>
              <p className="mt-2 text-sm text-stone-600">
                Scrivi cosa vuoi cambiare e la chat aggiorna il sito, con controlli di sicurezza.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <SectionTitle
            eyebrow="Modelli"
            title="Modelli per ruolo"
            description="Modelli pronti per la tua attività: servizi, prezzi e contatti."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((r) => (
              <Card key={r.role}>
                <h3 className="font-display text-xl capitalize text-stone-900">{r.role}</h3>
                <p className="mt-2 text-sm text-stone-600">{r.blurb}</p>
                <p className="mt-3">
                  <Link href="/catalogo" className="text-sm font-medium underline underline-offset-4">
                    Vedi il modello {r.role}
                  </Link>
                </p>
              </Card>
            ))}
          </div>
          <p className="mt-4">
            <MButton href="/catalogo" variant="ghost">
              Sfoglia il catalogo
            </MButton>
          </p>
        </section>

        <section className="mt-12">
          <SectionTitle
            eyebrow="Piani"
            title="Prezzi"
            description="Due piani. I prezzi si definiscono con noi: scrivici e ti facciamo un preventivo."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div id="senza-dominio">
                <h3 className="font-display text-xl text-stone-900">Piano Base</h3>
                <p className="mt-2 text-sm text-stone-600">
                  Sito subito su slug.munero.it, senza dominio. Ideale per partire in pochi minuti.
                </p>
                <ul className="mt-3 list-disc pl-5 text-sm text-stone-600">
                  <li>Sito su slug.munero.it</li>
                  <li>Modifiche via chat</li>
                  <li>Prenotazioni Cal.com o WhatsApp</li>
                </ul>
                <p className="mt-4">
                  <a
                    href="mailto:info@munero.it?subject=Richiesta%20prezzi%20Piano%20Base"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Contattaci per i prezzi
                  </a>
                </p>
              </div>
            </Card>
            <Card>
              <div id="con-dominio">
                <h3 className="font-display text-xl text-stone-900">Piano Dominio</h3>
                <p className="mt-2 text-sm text-stone-600">
                  Il tuo www.nome.it al posto di slug.munero.it, con attivazione e verifica guidate.
                </p>
                <ul className="mt-3 list-disc pl-5 text-sm text-stone-600">
                  <li>Dominio personalizzato</li>
                  <li>Tutto del Piano Base</li>
                  <li>Assistenza per attivazione e DNS</li>
                </ul>
                <p className="mt-4">
                  <a
                    href="mailto:info@munero.it?subject=Richiesta%20prezzi%20Piano%20Dominio"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Contattaci per i prezzi
                  </a>
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <SectionTitle eyebrow="FAQ" title="Domande frequenti" />
          <div className="grid gap-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-stone-900">{f.q}</summary>
                <p className="mt-2 text-sm text-stone-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 pb-16 text-center">
          <h2 className="font-display text-3xl text-stone-900">Pronto a mettere online il tuo studio?</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Parti dal modello del tuo ruolo: in pochi minuti hai un sito vero, modificabile via chat.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MButton href="/wizard">Crea il tuo sito</MButton>
            <MButton href="/catalogo" variant="ghost">
              Vedi i siti demo
            </MButton>
          </div>
        </section>
      </Container>
      <BrandFooter />
    </div>
  );
}
