/**
 * API Middleware Utilities
 *
 * withTimeout   — wraps any async handler with a hard timeout
 * withCacheHeaders — adds Cache-Control headers to a NextResponse
 * withFallback  — returns a fallback value if the handler throws
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── withTimeout ──────────────────────────────────────────────────────────────
/**
 * Wraps a route handler with a hard timeout.
 * Returns 504 Gateway Timeout if the handler exceeds the limit.
 *
 * @example
 * export const GET = withTimeout(async (req) => { ... }, 10_000);
 */
export function withTimeout(
    handler: (req: NextRequest, ctx?: any) => Promise<NextResponse>,
    timeoutMs = 10_000
) {
    return async (req: NextRequest, ctx?: any): Promise<NextResponse> => {
        const timeoutPromise = new Promise<NextResponse>((resolve) =>
            setTimeout(
                () => resolve(NextResponse.json({ error: 'Request timeout' }, { status: 504 })),
                timeoutMs
            )
        );
        return Promise.race([handler(req, ctx), timeoutPromise]);
    };
}

// ─── withCacheHeaders ─────────────────────────────────────────────────────────
/**
 * Adds Cache-Control headers to a NextResponse.
 *
 * @param res     - The response to add headers to
 * @param sMaxAge - CDN cache duration in seconds (default: 300 = 5 min)
 * @param swr     - Stale-while-revalidate in seconds (default: 600 = 10 min)
 */
export function withCacheHeaders(
    res: NextResponse,
    sMaxAge = 300,
    swr = 600
): NextResponse {
    res.headers.set(
        'Cache-Control',
        `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
    );
    return res;
}

// ─── withFallback ─────────────────────────────────────────────────────────────
/**
 * Wraps a handler — if it throws, returns the fallback value instead of 500.
 * Useful for non-critical endpoints where degraded data is better than an error.
 *
 * @example
 * export const GET = withFallback(handler, { products: [], total: 0 });
 */
export function withFallback<T>(
    handler: (req: NextRequest, ctx?: any) => Promise<NextResponse>,
    fallbackData: T,
    status = 200
) {
    return async (req: NextRequest, ctx?: any): Promise<NextResponse> => {
        try {
            return await handler(req, ctx);
        } catch (err) {
            console.error('[withFallback] Handler failed, returning fallback:', err);
            return NextResponse.json(fallbackData, { status });
        }
    };
}

// ─── apiResponse ──────────────────────────────────────────────────────────────
/**
 * Convenience wrapper: JSON response with optional cache headers.
 */
export function apiResponse<T>(
    data: T,
    options: {
        status?: number;
        cache?: boolean;
        sMaxAge?: number;
        swr?: number;
    } = {}
): NextResponse {
    const { status = 200, cache = false, sMaxAge = 300, swr = 600 } = options;
    const res = NextResponse.json(data, { status });
    if (cache) withCacheHeaders(res, sMaxAge, swr);
    return res;
}
