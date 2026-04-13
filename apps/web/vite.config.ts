import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@web", replacement: path.resolve(rootDir, "./src") },
      { find: /^@raw-core$/, replacement: path.resolve(rootDir, "../../packages/raw-core/src/index.ts") },
      { find: /^@dng-writer$/, replacement: path.resolve(rootDir, "../../packages/dng-writer/src/index.ts") },
      { find: /^@adobe-dng-wasm$/, replacement: path.resolve(rootDir, "../../packages/adobe-dng-wasm/src/index.ts") },
      { find: /^@libraw-wasm$/, replacement: path.resolve(rootDir, "../../packages/libraw-wasm/src/index.ts") },
      { find: /^@worker-runtime$/, replacement: path.resolve(rootDir, "../../packages/worker-runtime/src/index.ts") },
      { find: /^@raw-core\/(.*)$/, replacement: `${path.resolve(rootDir, "../../packages/raw-core/src")}/$1` },
      { find: /^@dng-writer\/(.*)$/, replacement: `${path.resolve(rootDir, "../../packages/dng-writer/src")}/$1` },
      { find: /^@adobe-dng-wasm\/(.*)$/, replacement: `${path.resolve(rootDir, "../../packages/adobe-dng-wasm/src")}/$1` },
      { find: /^@libraw-wasm\/(.*)$/, replacement: `${path.resolve(rootDir, "../../packages/libraw-wasm/src")}/$1` },
      { find: /^@worker-runtime\/(.*)$/, replacement: `${path.resolve(rootDir, "../../packages/worker-runtime/src")}/$1` }
    ]
  },
  server: {
    host: "0.0.0.0"
  },
  worker: {
    format: "es"
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    exclude: [".tools/**", "node_modules/**"]
  }
});
