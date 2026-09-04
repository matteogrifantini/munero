// Cyclic smoke suite: read-only flows, zero prod writes, zero tokens.
// Run: npx playwright test (needs `npm run build` first; uses next start on :3100).
import { test, expect, type Page } from '@playwright/test';

async function track(page: Page): Promise<() => Promise<void>> {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) problems.push('console: ' + m.text());
  });
  return async () => expect(problems, JSON.stringify(problems)).toEqual([]);
}

test('landing shows brand hero', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /senza pensieri/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /procedura guidata|wizard/i }).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/landing.png' });
  await clean();
});

test('catalog shows roles with live previews', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: /psicologo/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /barbiere/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /vedi demo/i }).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/catalogo.png', fullPage: true });
  await clean();
});

test('demo psicologo renders servizi, legal, no prenota', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/demo/psicologo');
  await expect(page.getByRole('heading', { name: /servizi/i })).toBeVisible();
  await expect(page.getByText(/P\.IVA/)).toBeVisible();
  await expect(page.locator('#prenota')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/shots/demo-psicologo.png', fullPage: true });
  await clean();
});

test('unknown tenant slug fail-closes to sospeso', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/t/questo-slug-non-esiste-xyz');
  await expect(page.getByRole('heading', { name: /sospeso/i })).toBeVisible();
  await expect(page.locator('#prenota')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/shots/sospeso.png' });
  await clean();
});

test('wizard step 1 shows roles', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/wizard');
  await expect(page.getByText(/psicologo/i).first()).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/wizard.png' });
  await clean();
});

test('unknown tenant manifest fail-closes with 404', async ({ request }) => {
  const r = await request.get('/t/questo-slug-non-esiste-xyz/manifest');
  expect(r.status()).toBe(404);
});

test('sitemap lists public pages, robots protects app routes', async ({ request }) => {
  const sm = await request.get('/sitemap.xml');
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  expect(xml).toContain('/demo/psicologo');
  expect(xml).toContain('/catalogo');
  const rb = await request.get('/robots.txt');
  expect(rb.status()).toBe(200);
  const txt = await rb.text();
  expect(txt).toContain('Disallow: /api/');
  expect(txt).toContain('sitemap.xml');
});

test('wizard click-through reaches rich info step with prefill', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/wizard');
  await page.getByRole('button', { name: /scegli psicologo/i }).click();
  await page.getByRole('button', { name: /usa essenziale/i }).click();
  await expect(page.getByText(/chi sono \(facoltativo\)/i)).toBeVisible();
  await page.getByRole('button', { name: /riempi dati demo/i }).click();
  await page.getByRole('button', { name: /vai all'anteprima/i }).click();
  await expect(page.getByText(/studio-prova\.munero\.it/i)).toBeVisible();
  await page.screenshot({ path: 'e2e/shots/wizard-rich.png' });
  await clean();
});

test('chat unauthenticated prompts login', async ({ page }) => {
  const clean = await track(page);
  await page.goto('/chat');
  await expect(page.getByRole('link', { name: /accedi|login/i })).toBeVisible();
  await clean();
});
