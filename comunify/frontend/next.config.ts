import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js 16: whitelist tunnel domain for /_next/* dev resources (HMR, chunks, etc.).
  // Sin esto, requests cross-origin desde dev-app.comunifyagents.com son bloqueadas.
  allowedDevOrigins: ["dev-app.comunifyagents.com"],
};

export default nextConfig;
