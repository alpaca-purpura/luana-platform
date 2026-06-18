import path from "path";

import type { NextConfig } from "next";

// BE URL para rewrites — dev usa NEXT_PUBLIC_API_URL (localhost:8003), prod/staging usa
// INTERNAL_API_URL (red Docker). El cliente hace fetch("/api/v1/...") relativo → pega Next.js
// primero; el rewrite lo proxya transparente al BE (sin CORS). Sin esto, /api/v1/* devolvía
// el 404 de Next (no existe route handler para /api/v1/*) salvo cuando se accede vía el túnel
// (cloudflared rutea /api→BE). Patrón portado de vitalia/nicolify (comunify-shell-organism T-e2e).
const beUrl =
  process.env["INTERNAL_API_URL"] ??
  process.env["NEXT_PUBLIC_API_URL"] ??
  "http://localhost:8003";

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
  // Proxy de /api/* y /public/* al BE. Client Components llaman fetch("/api/v1/...") con URL
  // relativa; Next.js intercepta y reenvía al BE — evita CORS + preserva headers de auth.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${beUrl}/api/:path*` },
      { source: "/public/:path*", destination: `${beUrl}/public/:path*` },
    ];
  },
};

export default nextConfig;
