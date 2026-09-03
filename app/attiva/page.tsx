'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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
    <main style={{ padding: 32 }}>
      <h1>Attiva il tuo sito</h1>
      <label>Modello
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="psicologo">Psicologo</option>
          <option value="barbiere">Barbiere</option>
        </select>
      </label>
      <br />
      <input placeholder="slug (es. studio-rossi)" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <br />
      <input placeholder="Nome visualizzato" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <br />
      <label>Piano
        <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)}>
          <option value="senza-dominio">Senza dominio — sito subito su slug.munero.it</option>
          <option value="con-dominio">Con dominio — setup una tantum + verifica DNS manuale</option>
        </select>
      </label>
      <br />
      <button onClick={submit}>Attiva</button>
      <p>{msg}</p>
    </main>
  );
}

export default function AttivaPage() {
  return (
    <Suspense>
      <AttivaForm />
    </Suspense>
  );
}
