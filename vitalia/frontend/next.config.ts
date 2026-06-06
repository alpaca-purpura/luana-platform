import type { NextConfig } from "next";

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
};

export default nextConfig;
