import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container size="wide">
        <section className="py-16 text-center sm:py-24">
          <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">
            Il sito del tuo studio, senza pensieri
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            Un sito professionale per la tua attività: lo crei in pochi minuti e lo aggiorni con una chat.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MButton href="/wizard">Crea il tuo sito</MButton>
            <MButton href="/catalogo" variant="ghost">
              Vedi i siti demo
            </MButton>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="font-display text-xl text-stone-900">Template per ruolo</h2>
            <p className="mt-2 text-sm text-stone-600">
              Modelli pronti per psicologi, barbieri e altre attività: servizi, prezzi e contatti.
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-xl text-stone-900">Modifiche via chat</h2>
            <p className="mt-2 text-sm text-stone-600">
              Scrivi cosa vuoi cambiare e la chat aggiorna il sito, con controlli di sicurezza.
            </p>
          </Card>
          <Card>
            <h2 className="font-display text-xl text-stone-900">Prenotazioni Cal.com</h2>
            <p className="mt-2 text-sm text-stone-600">
              Collega il tuo calendario Cal.com o un numero WhatsApp per ricevere prenotazioni.
            </p>
          </Card>
        </section>
        <section className="mt-12">
          <SectionTitle
            eyebrow="Piani"
            title="Semplice, senza sorprese"
            description="Senza dominio: sito subito su slug.munero.it. Con dominio: setup una tantum e verifica DNS manuale."
          />
          <MButton href="/wizard" variant="ghost">
            Inizia dalla procedura guidata
          </MButton>
        </section>
      </Container>
      <BrandFooter />
    </div>
  );
}
