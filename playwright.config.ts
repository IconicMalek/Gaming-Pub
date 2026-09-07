import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]],
});
