import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'firebase.spec.ts',
  workers: 1,
  timeout: 60_000,
  globalSetup: './e2e/firebase/setup.ts',
  use: { baseURL: 'http://127.0.0.1:4201', ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  webServer: {
    command: 'npm start -- --configuration e2e --host 127.0.0.1 --port 4201',
    url: 'http://127.0.0.1:4201',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
