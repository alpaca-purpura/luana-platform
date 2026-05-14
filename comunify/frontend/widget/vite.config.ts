/**
 * Vite UMD bundle config for the Comunify subscription widget.
 * Outputs a self-contained UMD bundle at dist/comunify.umd.js.
 * React is bundled (not external) so host pages don't need it.
 *
 * TODO T-widget-1 polish post-merge: add terser minification + source maps for prod
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/widget-entry.tsx"),
      name: "ComunifyWidget",
      fileName: "comunify",
      formats: ["umd"],
    },
    outDir: "dist",
    rollupOptions: {
      // Bundle React — widget must be self-contained
      external: [],
      output: {
        globals: {},
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
});
