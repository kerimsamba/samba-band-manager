import { chromium, defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const bundledChromium = chromium.executablePath();

export default defineConfig({
  testDir: "./tests",
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions: fs.existsSync(bundledChromium)
      ? undefined
      : { executablePath: chromePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      grep: /mobile:/,
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
