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
        // Third-party: MSG91 otp-provider.js emits this when hCaptcha's
        // closeChallenge network request fails (transient; not our code)
        "network-error",
        // hCaptcha internal failures (external script, not our code)
        /hcaptcha/i,
    ],

    // Never send errors originating from third-party scripts
    beforeSend(event) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
        const isThirdParty = frames.some(f =>
            f.filename?.includes("hcaptcha.com") ||
            f.filename?.includes("msg91.com") ||
            f.filename?.includes("otp-provider")
        );
        if (isThirdParty) return null; // Drop the event entirely
        return event;
    },

    // Environment tag
    environment: process.env.NODE_ENV || "development",
});
