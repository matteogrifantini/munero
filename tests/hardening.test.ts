// tests/hardening.test.ts — auth UX, empty states, headers, error boundary
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('hardening', () => {
  it('login redirects to dashboard on success', () => {
    const src = fs.readFileSync('app/(auth)/login/page.tsx', 'utf8');
    expect(src).toContain("location.href = '/dashboard'");
  });
  it('dashboard has empty state with wizard CTA', () => {
    const src = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
    expect(src).toContain('Non hai ancora nessun sito');
    expect(src).toContain('Crea il tuo primo sito');
  });
  it('security headers configured', () => {
    const src = fs.readFileSync('next.config.mjs', 'utf8');
    for (const h of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
      expect(src).toContain(h);
    }
  });
  it('global error boundary exists with retry', () => {
    expect(fs.existsSync('app/error.tsx')).toBe(true);
    const src = fs.readFileSync('app/error.tsx', 'utf8');
    expect(src).toContain('reset');
    expect(src).toContain('Riprova');
  });
  it('tenant metadata has description and opengraph', () => {
    const src = fs.readFileSync('app/t/[slug]/page.tsx', 'utf8');
    expect(src).toContain('openGraph');
    expect(src).toContain('description');
  });
});
