import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.tsx"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    server: {
      deps: {
        // `next-intl` is published as ESM and imports `next/navigation` as a
        // bare specifier. Next.js ships that entry as CJS, so Node's native
        // ESM loader cannot resolve it ("Did you mean to import
        // 'next/navigation.js'?"). Inlining makes Vite handle the import and
        // apply the `next/navigation` alias declared below.
        inline: ["next-intl", "use-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `next-intl/navigation` imports `next/navigation` as an ESM specifier.
      // Next.js ships that entry as CJS (`next/navigation.js`), so Vite's
      // ESM resolver needs the explicit `.js` extension to load it.
      "next/navigation": path.resolve(
        __dirname,
        "./node_modules/next/navigation.js"
      ),
    },
  },
});
