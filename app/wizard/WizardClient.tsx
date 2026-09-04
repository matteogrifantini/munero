'use client';
import { useState } from 'react';
import { siteSchema, type SiteConfig } from '@/lib/site-schema';
import SiteView from '@/components/SiteView';
import { BrandFooter, BrandHeader, Card, Container, Field, MButton, SectionTitle } from '@/components/ui';

type Role = { role: string; blurb: string; variants: { key: string; name: string; blurb: string }[] };
type ServiceRow = { name: string; price: string };

const inputClasses =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none';

export default function WizardClient({ roles, demoData }: { roles: Role[]; demoData?: Record<string, SiteConfig> }) {
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
  const errText = (path: string) => {
    const msgs = fieldErrors(path);
    return msgs.length > 0 ? msgs.join(', ') : undefined;
  };
  const err = (path: string) => {
    const msgs = fieldErrors(path);
    return msgs.length > 0 ? <small className="text-sm text-red-700">{msgs.join(', ')}</small> : null;
  };

  const pickRole = (role: string) => {
    setRoleKey(role);
    setOrdine(role === 'barbiere' ? '—' : 'OPL');
    setVariantKey('');
    setStep(2);
  };

  const fillDemo = () => {
    const demo = demoData?.[roleKey] ?? demoData?.['psicologo'];
    if (!demo) return;
    setName(demo.branding.name);
    setPhone(demo.branding.phone);
    setColor(demo.branding.primary_color);
    setTitle(demo.hero.title);
    setSubtitle(demo.hero.subtitle);
    setAddress(demo.address);
    setServices(demo.services.length > 0 ? demo.services.map((s) => ({ name: s.name, price: s.price })) : [{ name: '', price: '' }]);
    setNome(demo.legal.nome);
    setOrdine(demo.legal.ordine);
    setAlbo(demo.legal.albo_n);
    setPiva(demo.legal.piva);
    setPec(demo.legal.pec);
    if (demo.booking.type === 'calcom') {
      setBookingKind('calcom');
      setBookingValue(demo.booking.url);
    } else if (demo.booking.type === 'whatsapp') {
      setBookingKind('whatsapp');
      setBookingValue(demo.booking.number);
    } else {
      setBookingKind('none');
      setBookingValue('');
    }
    setSlug('studio-prova');
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
      <div className="min-h-screen bg-[#faf8f4]">
        <BrandHeader />
        <Container size="wide">
          <div className="py-10">
            <SectionTitle eyebrow="Passo 1 di 4" title="Crea il tuo sito: scegli la tua attività" />
            <div className="grid gap-4 sm:grid-cols-2">
              {roles.map((r) => (
                <Card key={r.role}>
                  <h2 className="font-display text-xl capitalize text-stone-900">{r.role}</h2>
                  <p className="mt-2 text-sm text-stone-600">{r.blurb}</p>
                  <div className="mt-4">
                    <MButton as="button" onClick={() => pickRole(r.role)}>Scegli {r.role}</MButton>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Container>
        <BrandFooter />
      </div>
    );
  }

  if (step === 2) {
    const role = roles.find((r) => r.role === roleKey);
    return (
      <div className="min-h-screen bg-[#faf8f4]">
        <BrandHeader />
        <Container size="wide">
          <div className="py-10">
            <SectionTitle eyebrow="Passo 2 di 4" title="Scegli la versione" />
            <div className="grid gap-4 sm:grid-cols-2">
              {role?.variants.map((v) => (
                <Card key={v.key}>
                  <h2 className="font-display text-xl text-stone-900">{v.name}</h2>
                  <p className="mt-2 text-sm text-stone-600">{v.blurb}</p>
                  <div className="mt-4">
                    <MButton as="button" onClick={() => { setVariantKey(v.key); setStep(3); }}>Usa {v.name}</MButton>
                  </div>
                </Card>
              ))}
            </div>
            <p className="mt-4 text-sm text-stone-600"><em>Altre versioni in arrivo.</em></p>
            <p className="mt-1 text-sm text-stone-600">Scelta: {roleKey}{variantKey ? ` · ${variantKey}` : ''}</p>
            <div className="mt-4">
              <MButton as="button" variant="ghost" onClick={() => setStep(1)}>Indietro</MButton>
            </div>
          </div>
        </Container>
        <BrandFooter />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#faf8f4]">
        <BrandHeader />
        <Container>
          <div className="py-10">
            <SectionTitle eyebrow="Passo 3 di 4" title={`Informazioni sul sito (${roleKey})`} />
            <Card>
              <div className="mb-4">
                <MButton as="button" variant="ghost" onClick={fillDemo}>Riempi dati demo</MButton>
              </div>
              <Field label="Nome attività" value={name} onChange={(e) => setName(e.target.value)} error={errText('branding.name')} />
              <Field label="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} error={errText('branding.phone')} />
              <Field label="Colore principale" type="color" value={color} onChange={(e) => setColor(e.target.value)} error={errText('branding.primary_color')} />
              <Field label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} error={errText('hero.title')} />
              <Field label="Sottotitolo" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} error={errText('hero.subtitle')} />
              <Field label="Indirizzo" value={address} onChange={(e) => setAddress(e.target.value)} error={errText('address')} />
              <h2 className="mb-3 mt-6 font-display text-xl text-stone-900">Servizi (max 12)</h2>
              {services.map((s, i) => (
                <div key={i} className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <input placeholder="Nome servizio" value={s.name} aria-label="Nome servizio"
                    onChange={(e) => setServices((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                    className={inputClasses} />
                  <input placeholder="Prezzo" value={s.price} aria-label="Prezzo"
                    onChange={(e) => setServices((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                    className={`${inputClasses} sm:max-w-40`} />
                  {services.length > 1 && (
                    <MButton as="button" variant="ghost" onClick={() => setServices((prev) => prev.filter((_, j) => j !== i))}>Rimuovi</MButton>
                  )}
                </div>
              ))}
              {err('services')}
              {services.length < 12 && (
                <div className="mt-2">
                  <MButton as="button" variant="ghost" onClick={() => setServices((prev) => [...prev, { name: '', price: '' }])}>Aggiungi servizio</MButton>
                </div>
              )}
              <h2 className="mb-3 mt-6 font-display text-xl text-stone-900">Dati legali</h2>
              <Field label="Nome / ragione sociale" value={nome} onChange={(e) => setNome(e.target.value)} error={errText('legal.nome')} />
              {isBarbiere ? (
                <p className="mb-4 text-sm text-stone-600">Ordine e albo non richiesti per questa attività (—).</p>
              ) : (
                <>
                  <Field label="Ordine" value={ordine} onChange={(e) => setOrdine(e.target.value)} error={errText('legal.ordine')} />
                  <Field label="Numero albo" value={albo} onChange={(e) => setAlbo(e.target.value)} error={errText('legal.albo_n')} />
                </>
              )}
              <Field label="P.IVA" value={piva} onChange={(e) => setPiva(e.target.value)} error={errText('legal.piva')} />
              <Field label="PEC" value={pec} onChange={(e) => setPec(e.target.value)} error={errText('legal.pec')} />
              <h2 className="mb-3 mt-6 font-display text-xl text-stone-900">Prenotazioni</h2>
              <div className="mb-4 flex flex-col gap-2 text-sm text-stone-800">
                <label className="flex items-center gap-2"><input type="radio" className="accent-stone-900" checked={bookingKind === 'none'} onChange={() => setBookingKind('none')} /> Nessuna</label>
                <label className="flex items-center gap-2"><input type="radio" className="accent-stone-900" checked={bookingKind === 'calcom'} onChange={() => setBookingKind('calcom')} /> Cal.com (URL)</label>
                <label className="flex items-center gap-2"><input type="radio" className="accent-stone-900" checked={bookingKind === 'whatsapp'} onChange={() => setBookingKind('whatsapp')} /> WhatsApp (numero)</label>
              </div>
              {bookingKind !== 'none' && (
                <div className="mb-4">
                  <input value={bookingValue} onChange={(e) => setBookingValue(e.target.value)} aria-label="Valore prenotazione"
                    placeholder={bookingKind === 'calcom' ? 'https://cal.com/tuo-nome' : '+39 333 000 0000'}
                    className={inputClasses} />
                  {err(bookingKind === 'calcom' ? 'booking.url' : 'booking.number')}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <MButton as="button" variant="ghost" onClick={() => setStep(2)}>Indietro</MButton>
                <MButton as="button" onClick={() => setStep(4)}>Vai all&apos;anteprima</MButton>
              </div>
              {!parsed.success && <p className="mt-3 text-sm text-red-700">Completa i campi evidenziati per vedere l&apos;anteprima.</p>}
            </Card>
          </div>
        </Container>
        <BrandFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <BrandHeader />
      <Container size="wide">
        <div className="py-10">
          <SectionTitle eyebrow="Passo 4 di 4" title="Anteprima" />
          {!parsed.success ? (
            <Card>
              <p className="text-sm text-red-700">I dati non sono validi. Torna indietro e completa i campi.</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-stone-700">{parsed.error.issues.map((i, k) => (<li key={k}>{i.path.join('.')}: {i.message}</li>))}</ul>
              <div className="mt-4">
                <MButton as="button" variant="ghost" onClick={() => setStep(3)}>Indietro</MButton>
              </div>
            </Card>
          ) : (
            <>
              <SiteView site={parsed.data} />
              <Card>
                <h2 className="mb-3 font-display text-xl text-stone-900">Pubblica</h2>
                <Field label="Indirizzo del sito (slug)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <div className="mb-4 flex flex-col gap-2 text-sm text-stone-800">
                  <label className="flex items-center gap-2"><input type="radio" className="accent-stone-900" checked={plan === 'senza-dominio'} onChange={() => setPlan('senza-dominio')} /> Senza dominio</label>
                  <label className="flex items-center gap-2"><input type="radio" className="accent-stone-900" checked={plan === 'con-dominio'} onChange={() => setPlan('con-dominio')} /> Con dominio</label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <MButton as="button" variant="ghost" onClick={() => setStep(3)}>Indietro</MButton>
                  <MButton as="button" onClick={create} disabled={creating}>Crea il mio sito</MButton>
                </div>
                {createError && <p role="alert" className="mt-3 text-sm text-red-700">{createError}</p>}
              </Card>
            </>
          )}
        </div>
      </Container>
      <BrandFooter />
    </div>
  );
}
