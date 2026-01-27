import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],  // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60,  // Cache images for 1 minute minimum
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.anitadongre.com',
      },
    ],
  },
  // Enable compression for better performance
  compress: true,

  // Remove console logs in production (except errors and warnings)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Fix Prisma compatibility with Turbopack
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
};

export default nextConfig;
