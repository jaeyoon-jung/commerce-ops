import { defineConfig, devices } from "@playwright/test";

const PORT = 3111;
const baseURL = `http://localhost:${PORT}`;

/**
 * Local only — not run in CI. The smoke spec asserts against a real database,
 * and the GitHub runner has no Postgres by decision (see spec.md → Testing
 * strategy). Bring the database up with `pnpm db:up` first.
 *
 * The dev server is used rather than a production build so the run needs no
 * Inngest cloud credentials, which `next start` demands at boot.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Operators work from phones in the field, so the smoke runs mobile-first.
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
