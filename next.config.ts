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
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
    ],
  },
  // Disable X-Powered-By header for security
  poweredByHeader: false,

  // Enable compression for better performance
  compress: true,

  // Suppress the Next.js dev overlay for known third-party script errors.
  // MSG91's otp-provider.js + hCaptcha fire console.error("network-error")
  // on every challenge close — this is purely cosmetic noise, not an app error.
  devIndicators: {
    position: 'bottom-left',
  },

  // Remove console logs in production (except errors and warnings)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Fix Prisma + BullMQ compatibility with Turbopack
  // - @prisma/client, prisma: Prisma generates files at build time
  // - pdfkit: Native Node.js PDF generation
  // - bullmq, ioredis: Redis job queue (Node.js only, uses ioredis/built/utils internally)
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdfkit', 'bullmq', 'ioredis'],

  // Increase body size limit for API route handlers (e.g. image uploads)
  // This applies to middleware and API routes (not Server Actions — those use experimental.serverActions.bodySizeLimit)
  experimental: {
    // FIX 15: optimizeCss inlines critical above-fold CSS and defers the rest.
    // Requires: npm install critters --save-dev
    // Rollback: remove this line if CSS rendering issues appear after build.
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // Raise the max body size for API Route Handlers
    proxyClientMaxBodySize: '50mb',
  },

  // Enterprise Security Headers for Production
  async headers() {
    // Content Security Policy - Explicit allow-list (no broad https: wildcard)
    // Explicit domains improve Lighthouse Best Practices score (avoids wildcard-scheme warnings)
    const csp = [
      "default-src 'self'",

      // Scripts: explicit allow-list for all required third-party services
      [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        // Razorpay
        "https://checkout.razorpay.com",
        "https://api.razorpay.com",
        // Cloudflare
        "https://static.cloudflareinsights.com",
        "https://cdnjs.cloudflare.com",
        // Google Analytics / GTM
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://ssl.google-analytics.com",
        // hCaptcha
        "https://js.hcaptcha.com",
        "https://hcaptcha.com",
        "https://newassets.hcaptcha.com",
        // MSG91
        "https://verify.msg91.com",
        "https://control.msg91.com",
        // Sentry CDN (error monitoring)
        "https://browser.sentry-cdn.com",
        "https://js.sentry-cdn.com",
        // Meta Pixel
        "https://connect.facebook.net",
      ].join(' '),

      // Workers: Allow web workers from self and blobs (required for Sentry/Razorpay)
      "worker-src 'self' blob:",

      // Styles: Self + inline + Google Fonts + hCaptcha
      [
        "style-src 'self' 'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://newassets.hcaptcha.com",
      ].join(' '),

      // Fonts: Self + Google Fonts + data URIs
      "font-src 'self' https://fonts.gstatic.com data:",

      // Images: Self + data + blob + all HTTPS image sources
      "img-src 'self' data: blob: https:",

      // Connect: API calls to all required services
      [
        "connect-src 'self'",
        // Razorpay
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://checkout.razorpay.com",
        // Cloudflare analytics beacon
        "https://cloudflareinsights.com",
        "https://static.cloudflareinsights.com",
        // Google Analytics
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://www.googletagmanager.com",
        // hCaptcha
        "https://hcaptcha.com",
        "https://newassets.hcaptcha.com",
        // MSG91
        "https://verify.msg91.com",
        "https://control.msg91.com",
        // Supabase
        "https://*.supabase.co",
        // Sentry
        "https://*.sentry.io",
        "https://sentry.io",
        // Cloudinary
        "https://api.cloudinary.com",
        "https://res.cloudinary.com",
        // Meta Pixel
        "https://www.facebook.com",
      ].join(' '),

      // Media: Video/audio from CDNs
      "media-src 'self' data: blob: https:",

      // Frames: Payment gateways, maps, hCaptcha, MSG91 widget, video embeds, Google auth
      [
        "frame-src 'self'",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://accounts.google.com",
        "https://verify.msg91.com",
        "https://control.msg91.com",
        "https://www.google.com",
        "https://maps.google.com",
        "https://hcaptcha.com",
        "https://*.hcaptcha.com",
        "https://newassets.hcaptcha.com",
        "https://www.youtube.com",
        "https://youtube.com",
        "https://player.vimeo.com",
      ].join(' '),

      // Security directives
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
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
            value: 'camera=(), microphone=(), geolocation=()'
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
