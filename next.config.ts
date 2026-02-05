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
    // Increase server action body size limit for video uploads
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB for video uploads
    },
  },

  // Security Headers for Production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://control.msg91.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.unsplash.com https://*.razorpay.com; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://control.msg91.com https://api.msg91.com; frame-src 'self' https://api.razorpay.com https://control.msg91.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
