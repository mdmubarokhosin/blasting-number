import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E tests run against the local Firebase emulators (Auth + Database)
 * and a dev server that is wired to them through VITE_USE_FIREBASE_EMULATORS.
 *
 * Start everything with:
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    headless: true,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --port 4173 --strictPort --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_API_KEY: "demo-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-blasting-e2e.firebaseapp.com",
      VITE_FIREBASE_DATABASE_URL: "http://127.0.0.1:9000?ns=demo-blasting-e2e",
      VITE_FIREBASE_PROJECT_ID: "demo-blasting-e2e",
      VITE_FIREBASE_STORAGE_BUCKET: "demo-blasting-e2e.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
      VITE_FIREBASE_APP_ID: "1:000000000000:web:0000demo",
    },
  },
});
