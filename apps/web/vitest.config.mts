import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}", "test/**/*.spec.{ts,tsx}"],
    // Time zone and locale decide how dates and prices are formatted.
    env: {
      TZ: "UTC",
      BACKEND_URL: "http://backend.test",
      SITE_URL: "https://wishpool.test",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/mocks/**",
        "src/**/__mocks__/**",
        "src/**/*.spec.*",
      ],
    },
  },
});
