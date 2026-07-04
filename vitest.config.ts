import { defineConfig } from "vitest/config";

// Unit tests only. The Playwright e2e specs (e2e/*.spec.ts) are run by
// `npm run test:e2e`, not vitest — exclude them here so `npm test` and CI
// don't try to execute them.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
