import { defineConfig, devices } from '@playwright/test';

/**
 * ACK Framework - Playwright E2E Test Konfigürasyonu
 * 
 * Detaylı dokümantasyon: https://playwright.dev/docs/intro
 */

export default defineConfig({
  // Test klasörü
  testDir: './e2e',

  // Tek test dosyası için timeout: 30 saniye
  timeout: 30 * 1000,

  // Bekleme timeout'u
  expect: {
    timeout: 5000,
  },

  // Başarısızlık üzerine duraksama
  fullyParallel: true,

  // Başarısız testleri tekrarla
  retries: process.env['CI'] ? 2 : 0,

  // Parallel worker sayısı
  workers: process.env['CI'] ? 1 : undefined,

  // Reporter'lar
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],

  // Shared settings tüm browsers için
  use: {
    // Tarayıcı action'ları için base URL
    baseURL: 'http://localhost:5173',

    // Network'ü kaydet
    trace: 'on-first-retry',

    // Screenshot al başarısızlık üzerine
    screenshot: 'only-on-failure',

    // Video kaydet başarısızlık üzerine
    video: 'retain-on-failure',
  },

  // Web server'ı konfigüre et
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },

  // Browser'lar
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Tablet test'leri
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // iPad
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],
});

