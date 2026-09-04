'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BrandFooter, BrandHeader, Card, Container, Field, MButton, SectionTitle } from '@/components/ui';

const inputClasses =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none';

function AttivaForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [template, setTemplate] = useState(params.get('template') ?? 'barbiere');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [plan, setPlan] = useState<'senza-dominio' | 'con-dominio'>('senza-dominio');
  const [msg, setMsg] = useState('');

  async function submit() {
    setMsg('');
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ template, slug, displayName, plan }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? 'Errore'); return; }
    router.push(`/dashboard?claimed=${data.slug}`);
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container>
        <div className="py-10">
          <SectionTitle eyebrow="Attivazione" title="Attiva il tuo sito" />
          <Card>
            <label htmlFor="attiva-template" className="mb-1 block text-sm font-medium text-stone-800">
              Modello
            </label>
            <select
              id="attiva-template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className={`${inputClasses} mb-4`}
            >
              <option value="psicologo">Psicologo</option>
              <option value="barbiere">Barbiere</option>
            </select>
            <Field label="Indirizzo del sito (slug)" placeholder="slug (es. studio-rossi)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Field label="Nome visualizzato" placeholder="Nome visualizzato" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <label htmlFor="attiva-plan" className="mb-1 block text-sm font-medium text-stone-800">
              Piano
            </label>
            <select
              id="attiva-plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value as typeof plan)}
              className={`${inputClasses} mb-4`}
            >
              <option value="senza-dominio">Senza dominio — sito subito su slug.munero.it</option>
              <option value="con-dominio">Con dominio — setup una tantum + verifica DNS manuale</option>
            </select>
            <MButton as="button" onClick={submit}>
              Attiva
            </MButton>
            {msg && <p role="alert" className="mt-3 text-sm text-red-700">{msg}</p>}
          </Card>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}

export default function AttivaPage() {
  return (
    <Suspense>
      <AttivaForm />
    </Suspense>
  );
}
