/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    // Optimize image loading
    formats: ['image/webp', 'image/avif'],
  },
  // Font optimization
  optimizeFonts: true,
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // Performance optimizations
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Fast Refresh optimization
  reactStrictMode: false, // Disable strict mode for faster refresh
  swcMinify: true, // Use SWC for faster builds
  // Development server configuration
  devIndicators: {
    buildActivity: false, // Hide build activity indicator for cleaner UI
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Faster development builds
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
