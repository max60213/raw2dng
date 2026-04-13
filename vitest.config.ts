import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@web", replacement: path.resolve(__dirname, "apps/web/src") },
      { find: /^@raw-core$/, replacement: path.resolve(__dirname, "packages/raw-core/src/index.ts") },
      { find: /^@dng-writer$/, replacement: path.resolve(__dirname, "packages/dng-writer/src/index.ts") },
      { find: /^@libraw-wasm$/, replacement: path.resolve(__dirname, "packages/libraw-wasm/src/index.ts") },
      { find: /^@worker-runtime$/, replacement: path.resolve(__dirname, "packages/worker-runtime/src/index.ts") },
      { find: /^@raw-core\/(.*)$/, replacement: `${path.resolve(__dirname, "packages/raw-core/src")}/$1` },
      { find: /^@dng-writer\/(.*)$/, replacement: `${path.resolve(__dirname, "packages/dng-writer/src")}/$1` },
      { find: /^@libraw-wasm\/(.*)$/, replacement: `${path.resolve(__dirname, "packages/libraw-wasm/src")}/$1` },
      { find: /^@worker-runtime\/(.*)$/, replacement: `${path.resolve(__dirname, "packages/worker-runtime/src")}/$1` }
    ]
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    exclude: [".tools/**", "node_modules/**"]
  }
});
