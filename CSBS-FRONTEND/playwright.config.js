import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  projects: [
    // Автотесты по DEV-сборке (моки API)
    {
      name: 'dev',
      testMatch: /0[1-5]-.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'on',
        video: 'off',
      },
    },

    // Автотесты по PROD-сборке (smoke-тесты на vite preview)
    {
      name: 'build',
      testMatch: /(?:build-smoke|profile-lazy)\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:4173',
        headless: true,
        screenshot: 'on',
        video: 'off',
      },
    },
  ],

  // webServer выбирается автоматически на основе проекта
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run build && npm run preview',
      port: 4173,
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
