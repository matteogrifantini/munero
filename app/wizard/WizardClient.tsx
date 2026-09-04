'use client';
import { useState } from 'react';
import { siteSchema } from '@/lib/site-schema';
import SiteView from '@/components/SiteView';

type Role = { role: string; blurb: string; variants: { key: string; name: string; blurb: string }[] };
type ServiceRow = { name: string; price: string };

export default function WizardClient({ roles }: { roles: Role[] }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [roleKey, setRoleKey] = useState('');
  const [variantKey, setVariantKey] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState('#2f5d50');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [address, setAddress] = useState('');
  const [services, setServices] = useState<ServiceRow[]>([{ name: '', price: '' }]);
  const [nome, setNome] = useState('');
  const [ordine, setOrdine] = useState('OPL');
  const [albo, setAlbo] = useState('');
  const [piva, setPiva] = useState('');
  const [pec, setPec] = useState('');
  const [bookingKind, setBookingKind] = useState<'none' | 'calcom' | 'whatsapp'>('none');
  const [bookingValue, setBookingValue] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('senza-dominio');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const isBarbiere = roleKey === 'barbiere';
  const booking =
    bookingKind === 'calcom' ? { type: 'calcom' as const, url: bookingValue }
    : bookingKind === 'whatsapp' ? { type: 'whatsapp' as const, number: bookingValue }
    : { type: 'none' as const };
  const draft = {
    schema_version: 'v1' as const,
    profession: (roleKey || 'psicologo') as 'psicologo' | 'barbiere',
    branding: { name, primary_color: color, phone },
    hero: { title, subtitle },
    services: services.filter((s) => s.name.trim() !== '' || s.price.trim() !== ''),
    address,
    booking,
    legal: { nome, ordine: isBarbiere ? '—' : ordine, albo_n: isBarbiere ? '—' : albo, piva, pec },
  };
  const parsed = siteSchema.safeParse(draft);
  const fieldErrors = (path: string): string[] => {
    if (parsed.success) return [];
    return parsed.error.issues
      .filter((i) => i.path.join('.') === path)
      .map((i) => i.message);
  };
  const err = (path: string) => {
    const msgs = fieldErrors(path);
    return msgs.length > 0 ? <small style={{ color: 'red' }}>{msgs.join(', ')}</small> : null;
  };

  const pickRole = (role: string) => {
    setRoleKey(role);
    setOrdine(role === 'barbiere' ? '—' : 'OPL');
    setVariantKey('');
    setStep(2);
  };

  const create = async () => {
    if (!parsed.success) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/create-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, displayName: name, plan, config: parsed.data }),
      });
      const data = await res.json();
      if (!res.ok || !data.slug) {
        setCreateError(data.error ?? 'Creazione non riuscita. Riprova.');
        return;
      }
      location.href = '/t/' + data.slug;
    } catch {
      setCreateError('Errore di rete. Riprova.');
    } finally {
      setCreating(false);
    }
  };

  if (step === 1) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Crea il tuo sito: scegli la tua attività</h1>
        {roles.map((r) => (
          <section key={r.role} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
            <h2>{r.role}</h2>
            <p>{r.blurb}</p>
            <button onClick={() => pickRole(r.role)}>Scegli {r.role}</button>
          </section>
        ))}
      </main>
    );
  }

  if (step === 2) {
    const role = roles.find((r) => r.role === roleKey);
    return (
      <main style={{ padding: 32 }}>
        <h1>Scegli la versione</h1>
        {role?.variants.map((v) => (
          <section key={v.key} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
            <h2>{v.name}</h2>
            <p>{v.blurb}</p>
            <button onClick={() => { setVariantKey(v.key); setStep(3); }}>Usa {v.name}</button>
          </section>
        ))}
        <p><em>Altre versioni in arrivo.</em></p>
        <p>Scelta: {roleKey}{variantKey ? ` · ${variantKey}` : ''}</p>
        <button onClick={() => setStep(1)}>Indietro</button>
      </main>
    );
  }

  if (step === 3) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Informazioni sul sito ({roleKey})</h1>
        <label>Nome attività<br /><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        {err('branding.name')}<br />
        <label>Telefono<br /><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        {err('branding.phone')}<br />
        <label>Colore principale<br /><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        {err('branding.primary_color')}<br />
        <label>Titolo<br /><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        {err('hero.title')}<br />
        <label>Sottotitolo<br /><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></label>
        {err('hero.subtitle')}<br />
        <label>Indirizzo<br /><input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        {err('address')}<br />
        <h2>Servizi (max 12)</h2>
        {services.map((s, i) => (
          <div key={i}>
            <input placeholder="Nome servizio" value={s.name}
              onChange={(e) => setServices((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} />
            <input placeholder="Prezzo" value={s.price}
              onChange={(e) => setServices((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))} />
            {services.length > 1 && (
              <button onClick={() => setServices((prev) => prev.filter((_, j) => j !== i))}>Rimuovi</button>
            )}
          </div>
        ))}
        {err('services')}
        {services.length < 12 && (
          <button onClick={() => setServices((prev) => [...prev, { name: '', price: '' }])}>Aggiungi servizio</button>
        )}
        <h2>Dati legali</h2>
        <label>Nome / ragione sociale<br /><input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        {err('legal.nome')}<br />
        {isBarbiere ? (
          <p>Ordine e albo non richiesti per questa attività (—).</p>
        ) : (
          <>
            <label>Ordine<br /><input value={ordine} onChange={(e) => setOrdine(e.target.value)} /></label>
            {err('legal.ordine')}<br />
            <label>Numero albo<br /><input value={albo} onChange={(e) => setAlbo(e.target.value)} /></label>
            {err('legal.albo_n')}<br />
          </>
        )}
        <label>P.IVA<br /><input value={piva} onChange={(e) => setPiva(e.target.value)} /></label>
        {err('legal.piva')}<br />
        <label>PEC<br /><input value={pec} onChange={(e) => setPec(e.target.value)} /></label>
        {err('legal.pec')}<br />
        <h2>Prenotazioni</h2>
        <label><input type="radio" checked={bookingKind === 'none'} onChange={() => setBookingKind('none')} /> Nessuna</label><br />
        <label><input type="radio" checked={bookingKind === 'calcom'} onChange={() => setBookingKind('calcom')} /> Cal.com (URL)</label><br />
        <label><input type="radio" checked={bookingKind === 'whatsapp'} onChange={() => setBookingKind('whatsapp')} /> WhatsApp (numero)</label><br />
        {bookingKind !== 'none' && (
          <><input value={bookingValue} onChange={(e) => setBookingValue(e.target.value)}
            placeholder={bookingKind === 'calcom' ? 'https://cal.com/tuo-nome' : '+39 333 000 0000'} />
            {err(bookingKind === 'calcom' ? 'booking.url' : 'booking.number')}<br /></>
        )}
        <p>
          <button onClick={() => setStep(2)}>Indietro</button>{' '}
          <button onClick={() => setStep(4)}>Vai all&apos;anteprima</button>
        </p>
        {!parsed.success && <p style={{ color: 'red' }}>Completa i campi evidenziati per vedere l&apos;anteprima.</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Anteprima</h1>
      {!parsed.success ? (
        <>
          <p style={{ color: 'red' }}>I dati non sono validi. Torna indietro e completa i campi.</p>
          <ul>{parsed.error.issues.map((i, k) => (<li key={k}>{i.path.join('.')}: {i.message}</li>))}</ul>
          <button onClick={() => setStep(3)}>Indietro</button>
        </>
      ) : (
        <>
          <SiteView site={parsed.data} />
          <h2>Pubblica</h2>
          <label>Indirizzo del sito (slug)<br /><input value={slug} onChange={(e) => setSlug(e.target.value)} /></label><br />
          <label><input type="radio" checked={plan === 'senza-dominio'} onChange={() => setPlan('senza-dominio')} /> Senza dominio</label><br />
          <label><input type="radio" checked={plan === 'con-dominio'} onChange={() => setPlan('con-dominio')} /> Con dominio</label><br />
          <p>
            <button onClick={() => setStep(3)}>Indietro</button>{' '}
            <button onClick={create} disabled={creating}>Crea il mio sito</button>
          </p>
          {createError && <p style={{ color: 'red' }}>{createError}</p>}
        </>
      )}
    </main>
  );
}
