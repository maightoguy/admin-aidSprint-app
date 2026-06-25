import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["e2e/**/*.test.{ts,tsx}"],
    setupFiles: ["e2e/setup.ts"],
    isolate: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});
