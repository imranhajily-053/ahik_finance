import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
  },
  webServer: {
    command: "npm run build && npm run start",
    port: 3000,
    reuseExistingServer: true,
  },
});
