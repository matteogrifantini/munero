'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BrandFooter, BrandHeader, Card, Container, MButton, SectionTitle } from '@/components/ui';

type Tenant = { id: string; slug: string; display_name: string };
type Result = { patch?: Record<string, unknown>; verdict?: string; via?: string; blocked?: boolean; reason?: string; error?: string };

const inputClasses =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none';

export default function ChatPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('tenants').select('id,slug,display_name').eq('owner_id', user.id);
      setTenants((data ?? []) as Tenant[]);
      if (data?.[0]) setTenantId((data[0] as Tenant).id);
    })();
  }, []);

  async function send() {
    setResult(null);
    const res = await fetch('/api/chat-edit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId, message }),
    });
    setResult((await res.json()) as Result);
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container>
        <div className="py-10">
          <SectionTitle eyebrow="Chat" title="Modifica il tuo sito con la chat" />
          <Card>
            <label htmlFor="chat-site" className="mb-1 block text-sm font-medium text-stone-800">
              Sito
            </label>
            <select
              id="chat-site"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className={`${inputClasses} mb-4`}
            >
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.display_name} — {t.slug}</option>)}
            </select>
            <label htmlFor="chat-message" className="mb-1 block text-sm font-medium text-stone-800">
              Messaggio
            </label>
            <input
              id="chat-message"
              placeholder="es. cambia il prezzo del taglio a 28 euro"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputClasses} mb-4`}
            />
            <MButton as="button" onClick={send} disabled={!tenantId || !message}>
              Invia
            </MButton>
            {result?.blocked && <p role="alert" className="mt-3 text-sm text-red-700">Bloccato: {result.reason}</p>}
            {result?.error && <p role="alert" className="mt-3 text-sm text-red-700">Errore: {result.error}</p>}
            {result?.verdict === 'applied' && (
              <div className="mt-4">
                <p className="text-sm font-medium text-stone-900">Modifica applicata (via {result.via}).</p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-stone-50 p-4 text-xs text-stone-800">
                  {JSON.stringify(result.patch, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
