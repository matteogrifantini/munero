import { Button, Card as HeroCard, Header, Input, Label, Link, TextField } from '@heroui/react';
import NextLink from 'next/link';
import type { ChangeEvent, CSSProperties, MouseEvent, ReactNode } from 'react';

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
      <Button
        type={props.type ?? 'button'}
        isDisabled={props.disabled}
        onPress={(e) => props.onClick?.(e as unknown as MouseEvent<HTMLButtonElement>)}
        style={style}
        className={className}
      >
        {children}
      </Button>
    );
  }
  if (props.href.startsWith('/')) {
    return (
      <NextLink href={props.href} style={style} className={className}>
        {children}
      </NextLink>
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
    <HeroCard>
      <HeroCard.Content className="p-6">{children}</HeroCard.Content>
    </HeroCard>
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
  onChange,
  value,
  defaultValue,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id ?? name;
  return (
    <TextField
      name={name}
      value={value as string | undefined}
      defaultValue={defaultValue as string | undefined}
      onChange={(v) =>
        onChange?.({ target: { value: v } } as unknown as ChangeEvent<HTMLInputElement>)
      }
      isInvalid={error ? true : undefined}
      fullWidth
      className="mb-4"
    >
      <Label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-800">
        {label}
      </Label>
      <Input
        id={id}
        {...props}
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--accent)] focus:outline-none"
      />
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </TextField>
  );
}

export function BrandHeader({ dashboardHref = '/dashboard' }: { dashboardHref?: string }) {
  return (
    <Header className="border-b border-stone-200 bg-[#faf8f4]">
      <Container size="wide">
        <div className="flex items-center justify-between py-4">
          <NextLink href="/" className="font-display text-2xl text-stone-900">
            Munero
          </NextLink>
          <nav className="flex items-center gap-4 text-sm">
            <NextLink href="/catalogo" className="text-stone-700 hover:text-stone-900">
              Catalogo
            </NextLink>
            <NextLink href={dashboardHref} className="text-stone-700 hover:text-stone-900">
              Accedi/Dashboard
            </NextLink>
          </nav>
        </div>
      </Container>
    </Header>
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
