import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MEDIACLAW_E2E_BASE_URL || 'http://localhost:3000';
const skipWebServer =
  process.env.MEDIACLAW_E2E_SKIP_WEBSERVER === '1' ||
  Boolean(process.env.MEDIACLAW_E2E_BASE_URL);
const reuseExistingServer =
  process.env.MEDIACLAW_E2E_REUSE_EXISTING_SERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  reporter: [['list']],
  webServer: skipWebServer
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        reuseExistingServer,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
