'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
export default function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('');
  return <main style={{ padding: 32 }}><h1>Accedi</h1>
    <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder="password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
    <button onClick={async () => {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pw });
      setMsg(error ? error.message : 'Accesso effettuato.');
    }}>Accedi</button><p>{msg}</p>
    <p><a href="/register">Non hai un account? Registrati</a></p></main>;
}
