// Run real-browser tests using Edge on a separate local port. Build the app before running
// this test suite.
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer: {
    command: "npm run start -- --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
