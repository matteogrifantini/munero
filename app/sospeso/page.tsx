import { BrandFooter, BrandHeader, Card, Container } from '@/components/ui';

export default function SospesoPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container>
        <div className="py-16">
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">Munero</p>
            <h1 className="font-display text-3xl text-stone-900">Servizio temporaneamente sospeso</h1>
            <p className="mt-3 text-sm text-stone-600">
              Il servizio è temporaneamente sospeso. Per assistenza contatta Munero:{' '}
              <a href="mailto:info@munero.it" className="font-medium underline underline-offset-4">
                info@munero.it
              </a>
              .
            </p>
          </Card>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
