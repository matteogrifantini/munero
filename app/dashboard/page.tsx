import { supabaseServer } from '@/lib/supabase-server';
export default async function Dashboard() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main style={{ padding: 32 }}><p>Devi <a href="/login">accedere</a>.</p></main>;
  const { data } = await sb.from('tenants').select('slug,display_name,status,plan').eq('owner_id', user.id);
  return <main style={{ padding: 32 }}><h1>I tuoi siti</h1>
    <p><a href="/catalogo">Scegli un sito demo</a> · <a href="/chat">Modifica con la chat AI</a></p>
    <ul>{(data ?? []).map(t => <li key={t.slug}>{t.display_name} — {t.slug} — {t.status} — {t.plan}</li>)}</ul></main>;
}
