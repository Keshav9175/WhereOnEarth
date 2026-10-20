import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Teaches Vitest the "@/..." shortcut (it means "src/...").
    tsconfigPaths: true,
  },
  test: {
    // Run tests in plain Node.js — our game rules don't need a browser.
    environment: "node",
  },
});
