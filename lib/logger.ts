/**
 * SECURITY: Enhanced Error and Security Event Logging
 * 
 * Provides centralized logging for:
 * - Application errors with context
 * - Security events (unauthorized access, rate limits, etc.)
 * - Payment-related events
 * 
 * IMPORTANT: Never log sensitive data (passwords, tokens, full payment info)
 */

interface LogMetadata {
    [key: string]: any;
}

/**
 * Log application errors with context
 */
export function logError(
    context: string,
    error: unknown,
    metadata?: LogMetadata
) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[ERROR:${context}]`, {
        error: errorMessage,
        stack: errorStack,
        metadata,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Log security-related events
 */
export function logSecurityEvent(
    event: string,
    details: LogMetadata
) {
    console.warn(`[SECURITY:${event}]`, {
        ...details,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Log unauthorized access attempts
 */
export function logUnauthorizedAttempt(
    path: string,
    userId?: string,
    reason?: string,
    ipAddress?: string
) {
    logSecurityEvent("UNAUTHORIZED_ACCESS", {
        path,
        userId: userId || "anonymous",
        reason: reason || "No session",
        ipAddress: ipAddress || "unknown",
    });
}

/**
 * Log rate limit violations
 */
export function logRateLimitViolation(
    endpoint: string,
    identifier: string,
    ipAddress?: string
) {
    logSecurityEvent("RATE_LIMIT_EXCEEDED", {
        endpoint,
        identifier,
        ipAddress: ipAddress || "unknown",
    });
}

/**
 * Log payment-related events (be careful not to log sensitive data)
 */
export function logPaymentEvent(
    event: "PAYMENT_INITIATED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "PAYMENT_VERIFICATION_FAILED",
    orderId: string,
    metadata?: LogMetadata
) {
    console.log(`[PAYMENT:${event}]`, {
        orderId,
        ...metadata,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Log info message with context
 */
export function logInfo(context: string, message: string, metadata?: LogMetadata) {
    console.log(`[INFO:${context}]`, {
        message,
        metadata,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Log server startup event
 */
export function logServerStart() {
    console.log(`[INFO:SERVER_START]`, {
        nodeEnv: process.env.NODE_ENV || "development",
        port: process.env.PORT || "3000 (default)",
        timestamp: new Date().toISOString(),
    });
}

/**
 * Log admin data fetch failures
 */
export function logAdminFetch(route: string, error: unknown, metadata?: LogMetadata) {
    logError(`ADMIN_FETCH:${route}`, error, metadata);
}
