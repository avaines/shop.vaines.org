import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "pages/tests/**/*.test.js",
      "worker/tests/**/*.test.js"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["worker/**/*.js"],
      exclude: ["worker/tests/**", "worker/wrangler.toml"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
});
