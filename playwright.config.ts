import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const useLocal = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
  },
  webServer: useLocal
    ? {
        command: 'PORT=3100 npm start',
        url: 'http://127.0.0.1:3100/',
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
