import { defineConfig } from "@playwright/test";

// Build first: npm run build
// Then: npm run test:e2e -- --config playwright.network.config.ts
export default defineConfig({
  testDir: "./tests",
  testMatch: "network.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    headless: true,
    viewport: { width: 1512, height: 982 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    launchOptions: { channel: "chrome" },
  },
  projects: [
    { name: "network-dev", use: { baseURL: "http://127.0.0.1:4327" } },
    { name: "network-preview", use: { baseURL: "http://127.0.0.1:4328" } },
  ],
  webServer: [
    {
      command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4327 --strictPort",
      url: "http://127.0.0.1:4327",
      reuseExistingServer: false,
    },
    {
      command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4328 --strictPort" +
        (process.env.GANTT_PAGES === "true" ? " --base=/GanttDamn/" : ""),
      url: "http://127.0.0.1:4328",
      reuseExistingServer: false,
    },
  ],
  reporter: "list",
});
