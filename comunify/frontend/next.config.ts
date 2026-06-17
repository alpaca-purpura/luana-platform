import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack (HB-78): kit @luana/* en core/ (fuera del app root) + zustand/middleware→CJS.
  // Ver receta en nicolify. Requiere root .npmrc node-linker=hoisted + patches/zustand.patch.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
    resolveAlias: {
      zustand: "zustand/esm/index.mjs",
      "zustand/react": "zustand/esm/react.mjs",
      "zustand/vanilla": "zustand/esm/vanilla.mjs",
      "zustand/middleware": "zustand/esm/middleware.mjs",
    },
  },
  transpilePackages: ["@luana/design-tokens", "@luana/ui-kit"],
  // Next.js 16: whitelist tunnel domain for /_next/* dev resources (HMR, chunks, etc.).
  // Sin esto, requests cross-origin desde dev-app.comunifyagents.com son bloqueadas.
  allowedDevOrigins: ["dev-app.comunifyagents.com"],
};

export default nextConfig;
