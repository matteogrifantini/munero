import type { CSSProperties } from 'react';
import { bookingSection } from '@/lib/booking';
import type { SiteConfig } from '@/lib/site-schema';
import { Card, Container, SectionTitle } from './ui';

type AccentStyle = CSSProperties & { ['--accent']?: string };

export default function SiteView({ site }: { site: SiteConfig }) {
  const prenota = bookingSection(site);
  const showLegal =
    site.legal.ordine !== '—' && site.legal.albo_n !== '—'
      ? `${site.legal.ordine} n. ${site.legal.albo_n}`
      : null;
  return (
    <div
      style={{ ['--accent' as never]: site.branding.primary_color } as AccentStyle}
      className="min-h-screen bg-[#faf8f4] text-stone-900"
    >
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#faf8f4]/95 backdrop-blur">
        <Container size="wide">
          <div className="flex items-center justify-between gap-4 py-3">
            <p className="truncate font-display text-lg">{site.branding.name}</p>
            <a
              href={`tel:${site.branding.phone.replace(/\s/g, '')}`}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              {site.branding.phone}
            </a>
          </div>
        </Container>
      </header>

      <main>
        <section className="py-12 sm:py-16">
          <Container>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">
              {site.hero.title}
            </h1>
            {site.hero.subtitle ? (
              <p className="mt-4 text-base text-stone-600 sm:text-lg">{site.hero.subtitle}</p>
            ) : null}
            <div aria-hidden="true" className="mt-6 h-1 w-16 rounded-full bg-[var(--accent)]" />
          </Container>
        </section>

        <section className="pb-12">
          <Container>
            <SectionTitle title="Servizi" />
            <ul className="grid gap-4 sm:grid-cols-2">
              {site.services.map((s) => (
                <li key={s.name}>
                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{s.name}</p>
                      <span className="shrink-0 rounded-full border border-stone-200 bg-[#faf8f4] px-3 py-1 text-sm font-medium text-stone-800">
                        {s.price}
                      </span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {prenota.kind === 'calcom' && (
          <section id="prenota" className="pb-12">
            <Container>
              <SectionTitle title="Prenota un appuntamento" />
              <Card>
                <div className="relative h-0 w-full overflow-hidden rounded-xl" style={{ paddingBottom: '62.5%' }}>
                  <iframe
                    src={prenota.embedUrl}
                    title="Prenotazione"
                    loading="lazy"
                    className="absolute h-full w-full border-0"
                  />
                </div>
                <p className="mt-4 text-sm text-stone-600">
                  La prenotazione avviene su Cal.com. Munero non memorizza i tuoi dati.
                </p>
                <p className="mt-2 text-sm">
                  <a
                    href={prenota.openUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[var(--accent)]"
                  >
                    Apri in una nuova scheda
                  </a>
                </p>
              </Card>
            </Container>
          </section>
        )}
        {prenota.kind === 'whatsapp' && (
          <section id="prenota" className="pb-12">
            <Container>
              <SectionTitle title="Prenota un appuntamento" />
              <a
                href={prenota.waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Contattaci su WhatsApp
              </a>
            </Container>
          </section>
        )}

        <section className="pb-12">
          <Container>
            <Card>
              <p className="font-medium">{site.address}</p>
              <p className="mt-2 text-sm text-stone-600">
                <a href={`tel:${site.branding.phone.replace(/\s/g, '')}`} className="underline">
                  {site.branding.phone}
                </a>
              </p>
            </Card>
          </Container>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <Container size="wide">
          <div className="flex flex-col gap-1 py-8 text-sm text-stone-600">
            <p className="font-display text-lg text-stone-900">{site.legal.nome}</p>
            {showLegal ? <p>{showLegal}</p> : null}
            <p>P.IVA {site.legal.piva}</p>
            <p>PEC {site.legal.pec}</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
