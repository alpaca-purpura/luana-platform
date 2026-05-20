import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Cross-origin Cloudflare Tunnel dev hostname for HMR + dev resources.
  // Without this Next.js blocks /_next/webpack-hmr from dev-app.vitalialat.com.
  allowedDevOrigins: ["dev-app.vitalialat.com"],
};

export default nextConfig;
