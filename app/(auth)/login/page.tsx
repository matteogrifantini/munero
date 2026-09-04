'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BrandFooter, BrandHeader, Card, Container, Field, MButton, SectionTitle } from '@/components/ui';

export default function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('');
  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container>
        <div className="py-10">
          <SectionTitle eyebrow="Accesso" title="Accedi" />
          <Card>
            <Field label="Email" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Field label="Password" placeholder="password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
            <MButton as="button" onClick={async () => {
              const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pw });
              if (error) { setMsg(error.message); return; }
              location.href = '/dashboard';
            }}>Accedi</MButton>
            {msg && <p className="mt-3 text-sm text-stone-700">{msg}</p>}
            <p className="mt-4 text-sm text-stone-600"><Link href="/register" className="font-medium underline underline-offset-4">Non hai un account? Registrati</Link></p>
          </Card>
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
