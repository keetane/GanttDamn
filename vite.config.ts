import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: "gantt-license-notices",
    generateBundle() {
      for (const [source, fileName] of [["LICENSE", "LICENSE.txt"], ["THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt"]]) {
        this.emitFile({ type: "asset", fileName, source: readFileSync(new URL(source, import.meta.url), "utf8") });
      }
    },
  }],
  test: { include: ["src/**/*.test.ts"] },
});
