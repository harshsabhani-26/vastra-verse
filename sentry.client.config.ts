import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring — sample 10% of transactions
    tracesSampleRate: 0.1,

    // Disable session replay in production to save quota
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    // Only enable in production
    enabled: process.env.NODE_ENV === "production",

    // Filter out noisy errors
    ignoreErrors: [
        // Browser extensions
        "ResizeObserver loop",
        // Network errors users cause by navigating away
        "AbortError",
        "Failed to fetch",
        "Load failed",
        // Next.js hydration warnings
        "Hydration failed",
        "Text content does not match",
    ],

    // Environment tag
    environment: process.env.NODE_ENV || "development",
});
