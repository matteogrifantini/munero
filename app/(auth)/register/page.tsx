'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
export default function Register() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('');
  return <main style={{ padding: 32 }}><h1>Registrati</h1>
    <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder="password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
    <button onClick={async () => {
      const { error } = await supabaseBrowser().auth.signUp({ email, password: pw });
      setMsg(error ? error.message : 'Controlla la tua email per confermare.');
    }}>Crea account</button><p>{msg}</p></main>;
}
