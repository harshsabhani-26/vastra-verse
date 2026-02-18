/**
 * Request Deduplication Middleware
 *
 * Uses idempotency keys to prevent processing the same request twice.
 * Clients pass `x-idempotency-key` header; the server stores the
 * response in Redis and returns it for duplicate requests.
 *
 * Usage:
 *   import { withIdempotency } from '@/lib/middleware/request-dedup';
 *
 *   export async function POST(req: NextRequest) {
 *     return withIdempotency(req, 300, async () => {
 *       // Process payment, create order, etc.
 *       return NextResponse.json({ success: true });
 *     });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logInfo } from '@/lib/logger';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const LOCK_SUFFIX = ':lock';

interface StoredResponse {
    status: number;
    body: any;
    processedAt: string;
}

/**
 * Wrap a mutating API handler with idempotency key deduplication.
 *
 * @param req      The incoming request
 * @param ttlSec   How long to remember the idempotency key (default: 5 min)
 * @param handler  The actual route handler
 */
export async function withIdempotency(
    req: NextRequest,
    ttlSec: number = 300,
    handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
    const idempotencyKey = req.headers.get(IDEMPOTENCY_HEADER);

    // If no key provided, just run handler normally
    if (!idempotencyKey) {
        return handler();
    }

    const cacheKey = `idemp:${idempotencyKey}`;
    const lockKey = `${cacheKey}${LOCK_SUFFIX}`;

    // Check if this key has already been processed
    const existing = await cache.get<StoredResponse>(cacheKey);
    if (existing) {
        logInfo('IDEMPOTENCY', `Returning cached response for key: ${idempotencyKey.slice(0, 8)}...`);
        const response = NextResponse.json(existing.body, { status: existing.status });
        response.headers.set('x-idempotency-replayed', 'true');
        response.headers.set('x-idempotency-processed-at', existing.processedAt);
        return response;
    }

    // Acquire lock to prevent concurrent processing of the same key
    const lockAcquired = await acquireLock(lockKey, 30); // 30s lock
    if (!lockAcquired) {
        logInfo('IDEMPOTENCY', `Concurrent request with same key: ${idempotencyKey.slice(0, 8)}...`);
        return NextResponse.json(
            { error: 'Request is being processed, please retry', code: 'CONCURRENT_REQUEST' },
            { status: 409 },
        );
    }

    try {
        // Process the request
        const response = await handler();

        // Store the response for future idempotent requests
        try {
            const body = await response.clone().json();
            await cache.set(
                cacheKey,
                {
                    status: response.status,
                    body,
                    processedAt: new Date().toISOString(),
                },
                ttlSec,
            );
        } catch {
            // If response isn't JSON, don't cache
        }

        return response;
    } finally {
        // Release lock
        await cache.del(lockKey);
    }
}

// ─── Lock Helpers ─────────────────────────────────────────────────────────────

async function acquireLock(key: string, ttlSec: number): Promise<boolean> {
    // Use exists + set as a simple lock mechanism
    const exists = await cache.exists(key);
    if (exists) return false;

    await cache.set(key, { locked: true, at: Date.now() }, ttlSec);
    return true;
}
