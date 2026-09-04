import type { CSSProperties } from 'react';
import { Card as HeroCard, Chip, Header, Link, Separator } from '@heroui/react';
import { bookingSection } from '@/lib/booking';
import type { SiteConfig } from '@/lib/site-schema';
import { Container, SectionTitle } from './ui';

type AccentStyle = CSSProperties & { ['--accent']?: string };

export default function SiteView({ site }: { site: SiteConfig }) {
  const prenota = bookingSection(site);
  const showOrdine = site.legal.ordine !== '—' ? site.legal.ordine : null;
  const showAlbo = site.legal.albo_n !== '—' ? `Albo n. ${site.legal.albo_n}` : null;
  return (
    <div
      style={{ ['--accent' as never]: site.branding.primary_color } as AccentStyle}
      className="min-h-screen bg-[#faf8f4] text-stone-900"
    >
      <Header className="sticky top-0 z-10 border-b border-stone-200 bg-[#faf8f4]/95 backdrop-blur">
        <Container size="wide">
          <div className="flex items-center justify-between gap-4 py-3">
            <p className="truncate font-display text-lg">{site.branding.name}</p>
            <Link
              href={`tel:${site.branding.phone.replace(/\s/g, '')}`}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              {site.branding.phone}
            </Link>
          </div>
        </Container>
      </Header>

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
                  <HeroCard>
                    <HeroCard.Content className="flex items-center justify-between gap-3 p-5">
                      <p className="font-medium">{s.name}</p>
                      <Chip className="shrink-0">{s.price}</Chip>
                    </HeroCard.Content>
                  </HeroCard>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {prenota.kind === 'calcom' && (
          <section id="prenota" className="pb-12">
            <Container>
              <SectionTitle title="Prenota un appuntamento" />
              <HeroCard>
                <HeroCard.Content className="p-5 sm:p-6">
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
                    <Link
                      href={prenota.openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-[var(--accent)]"
                    >
                      Apri in una nuova scheda
                    </Link>
                  </p>
                </HeroCard.Content>
              </HeroCard>
            </Container>
          </section>
        )}
        {prenota.kind === 'whatsapp' && (
          <section id="prenota" className="pb-12">
            <Container>
              <SectionTitle title="Prenota un appuntamento" />
              <Link
                href={prenota.waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Contattaci su WhatsApp
              </Link>
            </Container>
          </section>
        )}

        <section className="pb-12">
          <Container>
            <Separator className="mb-12" />
            <HeroCard>
              <HeroCard.Content className="p-5 sm:p-6">
                <p className="font-medium">{site.address}</p>
                <p className="mt-2 text-sm text-stone-600">
                  <Link
                    href={`tel:${site.branding.phone.replace(/\s/g, '')}`}
                    className="underline"
                  >
                    {site.branding.phone}
                  </Link>
                </p>
              </HeroCard.Content>
            </HeroCard>
          </Container>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <Container size="wide">
          <div className="flex flex-col gap-1 py-8 text-sm text-stone-600">
            <p className="font-display text-lg text-stone-900">{site.legal.nome}</p>
            {showOrdine ? <p>{showOrdine}</p> : null}
            {showAlbo ? <p>{showAlbo}</p> : null}
            <p>P.IVA {site.legal.piva}</p>
            <p>PEC {site.legal.pec}</p>
            <p className="mt-2 text-xs"><a href="/" className="underline underline-offset-4">Realizzato con Munero</a></p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
