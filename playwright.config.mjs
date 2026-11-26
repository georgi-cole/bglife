import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4188/bglife/";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "node e2e/serve-built-game.mjs",
    url: baseURL,
  },
});
