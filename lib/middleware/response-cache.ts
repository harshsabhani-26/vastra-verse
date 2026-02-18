/**
 * Response Cache Middleware
 *
 * Redis-backed response caching for API routes.
 * Caches the entire JSON response body keyed by URL + query params.
 * Respects Cache-Control headers and provides manual invalidation.
 *
 * Usage:
 *   import { withResponseCache } from '@/lib/middleware/response-cache';
 *
 *   export async function GET(req: NextRequest) {
 *     return withResponseCache(req, 60, async () => {
 *       const data = await getExpensiveData();
 *       return NextResponse.json(data);
 *     });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logInfo } from '@/lib/logger';

interface CachedResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
    cachedAt: string;
}

/**
 * Wrap an API handler with Redis-backed response caching.
 *
 * @param req      The incoming request
 * @param ttlSec   Cache TTL in seconds
 * @param handler  The actual route handler
 * @param keyPrefix Optional prefix for the cache key (default: 'resp')
 */
export async function withResponseCache(
    req: NextRequest,
    ttlSec: number,
    handler: () => Promise<NextResponse>,
    keyPrefix = 'resp',
): Promise<NextResponse> {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return handler();
    }

    // Skip cache if client says no-cache
    const cacheControl = req.headers.get('cache-control') || '';
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        return handler();
    }

    const cacheKey = `${keyPrefix}:${req.nextUrl.pathname}${req.nextUrl.search}`;

    // Try to return cached response
    const cached = await cache.get<CachedResponse>(cacheKey);
    if (cached) {
        logInfo('RESPONSE_CACHE', `HIT  ${cacheKey}`);
        const response = NextResponse.json(cached.body, { status: cached.status });
        response.headers.set('x-cache', 'HIT');
        response.headers.set('x-cached-at', cached.cachedAt);
        // Restore any custom headers
        for (const [key, value] of Object.entries(cached.headers)) {
            if (!key.startsWith('x-next-') && key !== 'content-type') {
                response.headers.set(key, value);
            }
        }
        return response;
    }

    // Cache miss — run handler
    logInfo('RESPONSE_CACHE', `MISS ${cacheKey}`);
    const response = await handler();

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
        try {
            const body = await response.clone().json();
            const headersObj: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headersObj[key] = value;
            });

            await cache.set(
                cacheKey,
                {
                    status: response.status,
                    headers: headersObj,
                    body,
                    cachedAt: new Date().toISOString(),
                },
                ttlSec,
            );
        } catch {
            // If response isn't JSON or caching fails, still return the response
        }
    }

    response.headers.set('x-cache', 'MISS');
    return response;
}

/**
 * Invalidate a cached response by URL path.
 */
export async function invalidateResponseCache(pathname: string, keyPrefix = 'resp'): Promise<void> {
    await cache.invalidatePattern(`${keyPrefix}:${pathname}*`);
    logInfo('RESPONSE_CACHE', `Invalidated: ${keyPrefix}:${pathname}*`);
}
