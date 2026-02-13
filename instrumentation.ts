/**
 * Next.js Instrumentation Hook
 * 
 * Runs once when the server starts.
 * Integrates Sentry for error monitoring.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Server-side Sentry initialization
        await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        // Edge runtime Sentry initialization
        await import("./sentry.edge.config");
    }
}

export const onRequestError = Sentry.captureRequestError;
