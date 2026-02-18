import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],  // AVIF first (smaller), WebP fallback
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [96, 128, 256, 384, 512],  // Thumbnails & small images
    minimumCacheTTL: 31536000,  // 1 year cache for immutable CDN assets
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
      {
        protocol: 'https',
        hostname: 'mwhfunrjmdygkhpwppgt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'razorpay.com',
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
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdfkit'],

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
      // Public API routes — cacheable by CDN and browsers
      {
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "harsh-pz",

  project: "javascript-nextjs-02",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
