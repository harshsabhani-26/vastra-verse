/**
 * Query Performance Logger
 * Logs slow database queries (>300ms) for monitoring and optimization
 */

interface QueryLog {
    route: string;
    operation: string;
    duration: number;
    params?: Record<string, any>;
    timestamp: Date;
}

/**
 * Log slow queries exceeding the threshold
 */
export function logSlowQuery(log: QueryLog) {
    const SLOW_QUERY_THRESHOLD_MS = 300;

    if (log.duration > SLOW_QUERY_THRESHOLD_MS) {
        console.warn(`[SLOW_QUERY] ${log.route} - ${log.operation} took ${log.duration}ms`, {
            params: log.params,
            timestamp: log.timestamp.toISOString(),
            severity: log.duration > 1000 ? 'CRITICAL' : 'WARNING'
        });
    }
}

/**
 * Wrapper to automatically log query performance
 * Usage: const result = await withQueryLogging('/api/admin/orders', 'findMany', () => prisma.order.findMany({...}))
 */
export async function withQueryLogging<T>(
    route: string,
    operation: string,
    query: () => Promise<T>,
    params?: Record<string, any>
): Promise<T> {
    const start = Date.now();

    try {
        const result = await query();
        const duration = Date.now() - start;

        logSlowQuery({
            route,
            operation,
            duration,
            params,
            timestamp: new Date()
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`[QUERY_ERROR] ${route} - ${operation} failed after ${duration}ms`, {
            error: error instanceof Error ? error.message : String(error),
            params,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

/**
 * Log general structured info
 */
export function logInfo(component: string, message: string, meta?: Record<string, any>) {
    console.log(`[INFO] ${component}: ${message}`, meta || {});
}

/**
 * Log structured warnings
 */
export function logWarning(component: string, message: string, meta?: Record<string, any>) {
    console.warn(`[WARNING] ${component}: ${message}`, meta || {});
}

/**
 * Log structured errors
 */
export function logError(component: string, message: string, error?: any, meta?: Record<string, any>) {
    console.error(`[ERROR] ${component}: ${message}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...meta
    });
}
