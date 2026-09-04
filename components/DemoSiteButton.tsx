'use client';
import { useState } from 'react';
import { Button } from '@heroui/react';
import psicologoTemplate from '@/content/templates/psicologo.json';

export default function DemoSiteButton({
  endpoint = '/api/create-site',
  slugPrefix = 'demo-',
  config = psicologoTemplate,
}: {
  endpoint?: string;
  slugPrefix?: string;
  config?: unknown;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');

  const create = async () => {
    setCreating(true);
    setError('');
    try {
      const demoSlug = slugPrefix + crypto.randomUUID().slice(0, 8);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: demoSlug,
          displayName: 'Sito demo',
          plan: 'senza-dominio',
          config: psicologoTemplate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Creazione non riuscita. Riprova.');
        return;
      }
      setSlug(data.slug);
      location.href = '/t/' + data.slug;
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <Button
        onPress={create}
        isDisabled={creating}
        className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-transparent px-5 py-3 text-sm font-medium text-stone-900 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creating ? 'Creazione...' : 'Crea sito demo'}
      </Button>
      {slug ? (
        <p className="mt-2 text-sm text-stone-700">
          Sito demo creato: <a href={`/t/${slug}`} className="underline underline-offset-4">{slug}</a>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
