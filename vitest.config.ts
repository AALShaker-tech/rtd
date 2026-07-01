import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests target the PURE domain logic (pricing + validation engines), which
// has no database, network, or React dependency. The `@/` alias mirrors the one
// in tsconfig.json so tests import modules exactly as the app does.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
