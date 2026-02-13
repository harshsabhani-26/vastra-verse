import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring — sample 10% of transactions
    tracesSampleRate: 0.1,

    // Only enable in production
    enabled: process.env.NODE_ENV === "production",

    // Environment tag
    environment: process.env.NODE_ENV || "development",
});
