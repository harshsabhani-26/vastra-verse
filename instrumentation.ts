/**
 * Next.js Instrumentation Hook
 * 
 * Runs once when the server starts.
 * Integrates both Sentry and custom observability services.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Server-side Sentry initialization
        await import("./sentry.server.config");

        // Initialize custom observability: seed default alert configurations
        const { seedDefaultAlerts } = await import("@/lib/alert-service");
        const { logServerStart } = await import("@/lib/logger");

        logServerStart();

        seedDefaultAlerts().catch((err) => {
            console.error("[INSTRUMENTATION] Failed to seed alerts:", err);
        });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        // Edge runtime Sentry initialization
        await import("./sentry.edge.config");
    }
}

export async function onRequestError(
    error: Error & { digest?: string },
    request: { path: string; method: string; headers: Record<string, string> },
    context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) {
    // Send to Sentry (existing)
    Sentry.captureException(error, {
        tags: {
            routerKind: context.routerKind,
            routeType: context.routeType,
            renderSource: context.renderSource,
        },
        extra: {
            path: request.path,
            method: request.method,
            routePath: context.routePath,
        },
    });

    // Also send to custom error tracker (DB-backed)
    const { captureApiError } = await import("@/lib/error-tracker");
    captureApiError(error, {
        endpoint: context.routePath || request.path,
        statusCode: 500,
        metadata: {
            method: request.method,
            routerKind: context.routerKind,
            routeType: context.routeType,
            renderSource: context.renderSource,
        },
    });
}
