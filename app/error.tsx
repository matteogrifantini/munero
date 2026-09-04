'use client';

import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container>
        <div className="py-10">
          <Card>
            <SectionTitle eyebrow="Errore" title="Qualcosa non ha funzionato" description="Riprova tra poco. Se il problema continua, scrivici a info@munero.it." />
            <MButton as="button" onClick={() => reset()}>Riprova</MButton>
          </Card>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
