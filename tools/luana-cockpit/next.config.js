/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // El cockpit lee filesystem fuera de su raíz (WORKSPACE_ROOT) · marcamos paquetes server externos para no bundlear
  serverExternalPackages: ['simple-git', 'chokidar'],
};

module.exports = nextConfig;
