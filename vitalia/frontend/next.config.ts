import type { NextConfig } from "next";

// BE URL for rewrites — dev uses NEXT_PUBLIC_API_URL (localhost:8002), prod/staging uses
// INTERNAL_API_URL (Docker network). Client-side fetch("/api/v1/...") hits Next.js first;
// rewrite transparently proxies it to the BE so no CORS config needed on the BE side.
// Bug fix: previously missing → useTenants / useCurrentUser / other client hooks got 404
// from Next.js (no route handler exists for /api/v1/*). (vitalia-shell-core-hardening T-7)
const beUrl =
  process.env["INTERNAL_API_URL"] ??
  process.env["NEXT_PUBLIC_API_URL"] ??
  "http://localhost:8002";

const nextConfig: NextConfig = {
  output: "standalone",
  // Cross-origin Cloudflare Tunnel dev hostname for HMR + dev resources.
  // Without this Next.js blocks /_next/webpack-hmr from dev-app.vitalialat.com.
  allowedDevOrigins: ["dev-app.vitalialat.com"],
  images: {
    // Hosts permitidos para next/image. El logo de marca (y assets) se sirven desde
    // Cloudflare R2: dev usa el dominio público gestionado pub-<hash>.r2.dev; cuando
    // se provisione el dominio propio de prod/staging (assets-*.vitalialat.com) agregarlo aquí.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
  // Proxy all /api/* and /public/* requests to the BE.
  // Client Components call fetchClient("/api/v1/...") with a relative URL; Next.js
  // intercepts and forwards to the BE — avoids CORS issues + keeps auth headers.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${beUrl}/api/:path*`,
      },
      {
        source: "/public/:path*",
        destination: `${beUrl}/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
