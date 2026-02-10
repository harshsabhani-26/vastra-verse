/**
 * Next.js Instrumentation Hook
 * 
 * Runs once when the server starts.
 * Used for env validation and server start logging.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    // Only run on server
    // Only run on server
    // if (typeof window !== "undefined") return;

    // const { validateEnv } = await import("@/lib/env");
    // const { logServerStart } = await import("@/lib/logger");

    // validateEnv();
    // logServerStart();
    console.error("DEBUG: Instrumentation skipped");
}
