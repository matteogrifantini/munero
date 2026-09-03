'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';

type Tenant = { id: string; slug: string; display_name: string };
type Result = { patch?: Record<string, unknown>; verdict?: string; via?: string; blocked?: boolean; reason?: string; error?: string };

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
    <main style={{ padding: 32 }}>
      <h1>Modifica il tuo sito con la chat</h1>
      <label>Sito
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.display_name} — {t.slug}</option>)}
        </select>
      </label>
      <br />
      <input
        placeholder="es. cambia il prezzo del taglio a 28 euro"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '100%', maxWidth: 480 }}
      />
      <br />
      <button onClick={send} disabled={!tenantId || !message}>Invia</button>
      {result?.blocked && <p>Bloccato: {result.reason}</p>}
      {result?.error && <p>Errore: {result.error}</p>}
      {result?.verdict === 'applied' && (
        <div>
          <p>Modifica applicata (via {result.via}).</p>
          <pre>{JSON.stringify(result.patch, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
