/**
 * Production-Grade Structured Logging
 * 
 * Features:
 * - Request ID generation and tracking
 * - Structured JSON output for production
 * - Human-readable dev mode
 * - Context injection (userId, orderId, etc.)
 * - Log levels: debug, info, warn, error
 * - Error serialization with stack traces
 * 
 * IMPORTANT: Never log sensitive data (passwords, tokens, full payment info)
 */

// ============================================================
// Request ID Generation
// ============================================================

let counter = 0;

/**
 * Generate a unique request ID (no external dependency)
 * Format: timestamp-random-counter
 */
export function generateRequestId(): string {
    counter = (counter + 1) % 100000;
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}-${rand}-${counter.toString(36).padStart(3, '0')}`;
}

// ============================================================
// Types
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
    [key: string]: any;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    requestId?: string;
    context?: string;
    metadata?: LogMetadata;
    error?: {
        message: string;
        name: string;
        stack?: string;
    };
}

interface LogContext {
    requestId?: string;
    userId?: string;
    path?: string;
    method?: string;
    [key: string]: any;
}

// ============================================================
// Logger Implementation
// ============================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL || (IS_PRODUCTION ? 'info' : 'debug')) as LogLevel;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

function serializeError(error: unknown): { message: string; name: string; stack?: string } {
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stack: IS_PRODUCTION ? undefined : error.stack,
        };
    }
    return {
        message: String(error),
        name: 'UnknownError',
    };
}

function formatLogEntry(entry: LogEntry): string {
    if (IS_PRODUCTION) {
        // JSON format for log aggregation (Railway, Sentry, Datadog, etc.)
        return JSON.stringify(entry);
    }

    // Human-readable format for development
    const prefix = entry.requestId ? `[${entry.requestId}]` : '';
    const ctx = entry.context ? `[${entry.context}]` : '';
    const level = entry.level.toUpperCase().padEnd(5);
    const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    const err = entry.error ? ` | Error: ${entry.error.message}` : '';

    return `${level} ${prefix}${ctx} ${entry.message}${meta}${err}`;
}

function writeLog(entry: LogEntry): void {
    const formatted = formatLogEntry(entry);

    switch (entry.level) {
        case 'error':
            console.error(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'debug':
            console.debug(formatted);
            break;
        default:
            console.log(formatted);
    }
}

// ============================================================
// Public API
// ============================================================

/**
 * Create a context-bound logger for a specific request
 */
export function createLogger(context: LogContext) {
    return {
        debug: (message: string, metadata?: LogMetadata) => {
            if (!shouldLog('debug')) return;
            writeLog({
                level: 'debug',
                message,
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                context: context.path,
                metadata: { ...context, ...metadata, requestId: undefined, path: undefined },
            });
        },

        info: (message: string, metadata?: LogMetadata) => {
            if (!shouldLog('info')) return;
            writeLog({
                level: 'info',
                message,
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                context: context.path,
                metadata: { ...context, ...metadata, requestId: undefined, path: undefined },
            });
        },

        warn: (message: string, metadata?: LogMetadata) => {
            if (!shouldLog('warn')) return;
            writeLog({
                level: 'warn',
                message,
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                context: context.path,
                metadata: { ...context, ...metadata, requestId: undefined, path: undefined },
            });
        },

        error: (message: string, error?: unknown, metadata?: LogMetadata) => {
            if (!shouldLog('error')) return;
            writeLog({
                level: 'error',
                message,
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                context: context.path,
                metadata: { ...context, ...metadata, requestId: undefined, path: undefined },
                error: error ? serializeError(error) : undefined,
            });
        },
    };
}

// ============================================================
// Convenience Functions (backward compatible)
// ============================================================

/**
 * Log application errors with context
 */
export function logError(
    context: string,
    error: unknown,
    metadata?: LogMetadata
) {
    if (!shouldLog('error')) return;
    writeLog({
        level: 'error',
        message: `Error in ${context}`,
        timestamp: new Date().toISOString(),
        context,
        metadata,
        error: serializeError(error),
    });
}

/**
 * Log security-related events
 */
export function logSecurityEvent(
    event: string,
    details: LogMetadata
) {
    if (!shouldLog('warn')) return;
    writeLog({
        level: 'warn',
        message: `Security event: ${event}`,
        timestamp: new Date().toISOString(),
        context: `SECURITY:${event}`,
        metadata: details,
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
    event: "PAYMENT_INITIATED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "PAYMENT_VERIFICATION_FAILED" | "WEBHOOK_RECEIVED",
    orderId: string,
    metadata?: LogMetadata
) {
    if (!shouldLog('info')) return;
    writeLog({
        level: 'info',
        message: `Payment: ${event}`,
        timestamp: new Date().toISOString(),
        context: `PAYMENT:${event}`,
        metadata: { orderId, ...metadata },
    });
}

/**
 * Log info message with context
 */
export function logInfo(context: string, message: string, metadata?: LogMetadata) {
    if (!shouldLog('info')) return;
    writeLog({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        context,
        metadata,
    });
}

/**
 * Log server startup event
 */
export function logServerStart() {
    writeLog({
        level: 'info',
        message: 'Server started',
        timestamp: new Date().toISOString(),
        context: 'SERVER',
        metadata: {
            nodeEnv: process.env.NODE_ENV || "development",
            port: process.env.PORT || "3000",
        },
    });
}

/**
 * Log admin data fetch failures
 */
export function logAdminFetch(route: string, error: unknown, metadata?: LogMetadata) {
    logError(`ADMIN_FETCH:${route}`, error, metadata);
}
