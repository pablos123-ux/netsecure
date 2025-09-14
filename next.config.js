/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // Fast Refresh optimization
  reactStrictMode: false, // Disable strict mode for faster refresh
  swcMinify: true, // Use SWC for faster builds
  // Development server configuration
  devIndicators: {
    buildActivity: false, // Hide build activity indicator for cleaner UI
  },
};

module.exports = nextConfig;
