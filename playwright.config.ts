import { defineConfig, devices } from '@playwright/test'

/**
 * VelocityRead E2E configuration.
 *
 * The Vite dev server serves the app under the `/velocityread/` base path
 * (see vite.config.ts `base`), so baseURL includes it. A dedicated port is
 * used to avoid clashing with any long-running dev server on 5173.
 */
const PORT = 5199
const baseURL = `http://localhost:${PORT}/velocityread/`

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  timeout: 30_000,
  expect: { timeout: 6_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL,
    actionTimeout: 8_000,
    // Artifacts: captured automatically for every failing test.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      // 375px is the layout floor promised in PRODUCT.md — run the mobile
      // spec file with touch + mobile emulation.
      name: 'mobile',
      testMatch: /mobile\.spec\.ts/,
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 90_000,
  },
})
