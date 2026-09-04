import Link from 'next/link';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type AccentStyle = CSSProperties & { ['--accent']?: string };

const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
const ghostButtonClasses =
  'inline-flex items-center justify-center rounded-xl border border-stone-300 bg-transparent px-5 py-3 text-sm font-medium text-stone-900 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50';

export function Container({
  children,
  size = 'md',
}: {
  children: ReactNode;
  size?: 'md' | 'wide';
}) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 ${size === 'wide' ? 'max-w-5xl' : 'max-w-3xl'}`}>
      {children}
    </div>
  );
}

type MButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  accent?: string;
} & (
  | { as?: 'link'; href: string }
  | {
      as: 'button';
      href?: never;
      type?: 'button' | 'submit';
      disabled?: boolean;
      onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    }
);

export function MButton(props: MButtonProps) {
  const { children, variant = 'primary', accent } = props;
  const style = { ['--accent' as never]: accent } as AccentStyle;
  const className = variant === 'ghost' ? ghostButtonClasses : primaryButtonClasses;
  if (props.as === 'button') {
    return (
      <button
        type={props.type ?? 'button'}
        onClick={props.onClick}
        disabled={props.disabled}
        style={style}
        className={className}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={props.href} style={style} className={className}>
      {children}
    </Link>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl text-stone-900 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 text-sm text-stone-600">{description}</p> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none"
      />
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BrandHeader({ dashboardHref = '/dashboard' }: { dashboardHref?: string }) {
  return (
    <header className="border-b border-stone-200 bg-[#faf8f4]">
      <Container size="wide">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="font-display text-2xl text-stone-900">
            Munero
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/catalogo" className="text-stone-700 hover:text-stone-900">
              Catalogo
            </Link>
            <Link href={dashboardHref} className="text-stone-700 hover:text-stone-900">
              Accedi/Dashboard
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <Container size="wide">
        <div className="flex flex-col gap-2 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg text-stone-900">Munero</p>
          <p>
            Contatto: <a href="mailto:info@munero.it" className="underline">info@munero.it</a>
          </p>
          <p>Piattaforma in comodato d&apos;uso</p>
        </div>
      </Container>
    </footer>
  );
}
