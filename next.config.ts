import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
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

  // Enterprise Security Headers for Production
  async headers() {
    // Strict Content Security Policy - Least Privilege Principle
    const csp = [
      "default-src 'self'",
      // Scripts: Only trusted domains for Razorpay, MSG91, hCaptcha
      // NOTE: unsafe-eval kept for Razorpay checkout SDK compatibility
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://verify.msg91.com https://control.msg91.com https://js.hcaptcha.com https://hcaptcha.com https://cdnjs.cloudflare.com",
      // Styles: Self + Google Fonts + MSG91 widget styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://verify.msg91.com https://control.msg91.com https://hcaptcha.com https://cdnjs.cloudflare.com",
      // Fonts: Self + Google Fonts + data URIs
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: Trusted CDNs and blob URIs
      "img-src 'self' data: blob: https://images.unsplash.com https://*.razorpay.com https://*.supabase.co https://res.cloudinary.com https://maps.googleapis.com https://maps.gstatic.com https://cdnjs.cloudflare.com",
      // Connect: API endpoints + Sentry for error reporting
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://verify.msg91.com https://control.msg91.com https://api.msg91.com https://*.supabase.co https://hcaptcha.com https://*.hcaptcha.com https://api.db-ip.com https://*.sentry.io https://*.ingest.sentry.io",
      // Frames: Payment gateways, maps, hCaptcha, MSG91 widget
      "frame-src 'self' https://api.razorpay.com https://verify.msg91.com https://control.msg91.com https://www.google.com https://maps.google.com https://hcaptcha.com https://*.hcaptcha.com https://newassets.hcaptcha.com",
      // Security directives
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests"
    ].join('; ');

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
            value: 'max-age=63072000; includeSubDomains; preload'
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
            value: csp
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG || "your-org",
  project: process.env.SENTRY_PROJECT || "vastra-verse",

  // Only upload source maps in CI/CD for security
  silent: !process.env.CI,

  // Don't widen the scope of the webpack config
  widenClientFileUpload: true,

  // Webpack-specific Sentry options
  webpack: {
    // Automatically tree-shake Sentry logger in production
    treeshake: {
      removeDebugLogging: true,
    },
    // Automatically instrument API routes and server components
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    autoInstrumentAppDirectory: true,
  },
});
