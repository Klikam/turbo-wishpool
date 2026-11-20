import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Generated files, not our source: `msw init`, Storybook and the browser
    // tests' build and reports.
    ignores: [
      "public/mockServiceWorker.js",
      "storybook-static/**",
      ".next-e2e/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
];
