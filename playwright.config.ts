import { defineConfig } from "@playwright/test";
const port = Number(process.env.GANTT_TEST_PORT ?? 4317);
const url = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: url,
    headless: true,
    viewport: { width: 1512, height: 982 },
    launchOptions:
      process.env.PLAYWRIGHT_CHANNEL === "chromium"
        ? {}
        : { channel: "chrome" },
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
  },
  reporter: "list",
});
