// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    esmExternals: "loose",
  },
  webpack: (config) => {
    // Disable all optimizations
    config.optimization.minimize = false;
    config.optimization.minimizer = [];
    return config;
  },
  swcMinify: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
