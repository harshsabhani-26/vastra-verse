/**
 * Performance Tracking Middleware
 * 
 * Wraps API route handlers to automatically track:
 * - Execution time
 * - HTTP status codes
 * - Request metadata
 * 
 * Usage:
 *   import { withPerformanceTracking } from '@/lib/middleware/performance-tracking';
 * 
 *   export const GET = withPerformanceTracking('/api/orders', async (req) => {
 *       // handler logic
 *       return NextResponse.json({ data });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordPerformance } from '@/lib/metrics';
import { captureApiError } from '@/lib/error-tracker';
import { generateRequestId, createLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

type RouteHandler = (
    req: NextRequest,
    context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API route handler with performance tracking and error capture.
 */
export function withPerformanceTracking(
    routeName: string,
    handler: RouteHandler
): RouteHandler {
    return async (req: NextRequest, context?: any) => {
        const start = performance.now();
        const requestId = generateRequestId();
        const method = req.method;

        const log = createLogger({
            requestId,
            path: routeName,
            method,
        });

        try {
            const response = await handler(req, context);
            const duration = performance.now() - start;

            // Record performance metric
            recordPerformance('API', routeName, duration, response.status, {
                method,
                requestId,
            });

            // Log slow requests
            if (duration > 1000) {
                log.warn(`Slow API response: ${Math.round(duration)}ms`, {
                    duration: `${Math.round(duration)}ms`,
                    status: response.status,
                });
            }

            return response;
        } catch (error) {
            const duration = performance.now() - start;

            // Send to Sentry
            Sentry.captureException(error, {
                tags: { route: routeName, method },
                extra: { requestId, duration: `${Math.round(duration)}ms` },
            });

            // Send to custom DB tracker
            captureApiError(error, {
                endpoint: routeName,
                requestId,
                statusCode: 500,
                metadata: { method, duration: `${Math.round(duration)}ms` },
            });

            // Record performance (failed request)
            recordPerformance('API', routeName, duration, 500, {
                method,
                requestId,
                error: true,
            });

            log.error('Unhandled API error', error, { duration: `${Math.round(duration)}ms` });

            return NextResponse.json(
                { error: 'Internal server error', requestId },
                { status: 500 }
            );
        }
    };
}

/**
 * Track external API call performance.
 * Returns the response and records the latency.
 * 
 * Usage:
 *   const data = await trackExternalCall('razorpay', async () => {
 *       return fetch('https://api.razorpay.com/...');
 *   });
 */
export async function trackExternalCall<T>(
    serviceName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        recordPerformance('EXTERNAL_API', serviceName, duration, undefined, metadata);
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        recordPerformance('EXTERNAL_API', serviceName, duration, undefined, { ...metadata, error: true });
        throw error;
    }
}

/**
 * Track database query performance.
 * 
 * Usage:
 *   const orders = await trackDbQuery('getOrders', async () => {
 *       return prisma.order.findMany({ ... });
 *   });
 */
export async function trackDbQuery<T>(
    queryName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        recordPerformance('DATABASE', queryName, duration, undefined, metadata);
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        recordPerformance('DATABASE', queryName, duration, undefined, { ...metadata, error: true });
        throw error;
    }
}
