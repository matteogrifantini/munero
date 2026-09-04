import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'PORT=3100 npm start',
    url: 'http://127.0.0.1:3100/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
