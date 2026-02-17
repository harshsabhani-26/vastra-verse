import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';


// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate Limit Configurations
 */
export const rateLimitConfigs = {
    // Auth routes: 5 requests per minute
    auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:auth',
    }),

    // Payment verification: 3 requests per minute
    paymentVerify: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:payment:verify',
    }),

    // Payment general: 10 requests per minute
    payment: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:payment',
    }),

    // Order creation: 5 requests per minute
    orderCreate: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:order:create',
    }),

    // Admin routes: 30 requests per minute
    admin: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:admin',
    }),

    // Default/general API: 20 requests per minute
    default: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m' as any),
        analytics: true,
        prefix: 'ratelimit:default',
    }),
} as const;

/**
 * Get identifier for rate limiting
 * Prioritizes user ID if logged in, falls back to IP address
 */
export async function getRateLimitIdentifier(req: NextRequest): Promise<string> {
    // Try to get user session
    try {
        const session = await auth();
        if (session?.user?.id) {
            return `user:${session.user.id}`;
        }
    } catch (error) {
        // Session check failed, fall back to IP
    }

    // Fall back to IP address
    const ip = getClientIp(req);
    return `ip:${ip}`;
}

/**
 * Extract client IP from request
 */
export function getClientIp(req: NextRequest): string {
    // Check common headers in order of reliability
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}

/**
 * Apply rate limiting to a route handler
 * 
 * @param ratelimit - The Ratelimit instance to use
 * @param identifier - Unique identifier (user ID or IP)
 * @returns Success response or 429 rate limit error
 */
export async function applyRateLimit(
    ratelimit: Ratelimit,
    identifier: string
): Promise<{ success: true } | NextResponse> {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
        return NextResponse.json(
            {
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                limit,
                remaining: 0,
                reset: new Date(reset).toISOString(),
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': reset.toString(),
                    'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
                },
            }
        );
    }

    return { success: true };
}

/**
 * Reusable rate limit middleware
 * Use this in your route handlers
 * 
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(req, 'auth');
 *   if (rateLimitResult instanceof NextResponse) {
 *     return rateLimitResult; // 429 response
 *   }
 *   
 *   // Continue with your logic
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export async function checkRateLimit(
    req: NextRequest,
    type: keyof typeof rateLimitConfigs
): Promise<{ success: true; identifier: string } | NextResponse> {
    const identifier = await getRateLimitIdentifier(req);
    const ratelimit = rateLimitConfigs[type];

    const result = await applyRateLimit(ratelimit, identifier);

    if (result instanceof NextResponse) {
        // Log rate limit violation
        console.warn(`[RateLimit] ${type.toUpperCase()} exceeded for ${identifier}`);
        return result;
    }

    return { success: true, identifier };
}

/**
 * Custom rate limit with specific configuration
 * 
 * @example
 * ```typescript
 * const result = await checkCustomRateLimit(req, 10, '5 m'); // 10 requests per 5 minutes
 * ```
 */
export async function checkCustomRateLimit(
    req: NextRequest,
    maxRequests: number,
    window: string
): Promise<{ success: true; identifier: string } | NextResponse> {
    const identifier = await getRateLimitIdentifier(req);

    const customRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, window as any),
        analytics: true,
        prefix: 'ratelimit:custom',
    });

    const result = await applyRateLimit(customRateLimit, identifier);

    if (result instanceof NextResponse) {
        console.warn(`[RateLimit] CUSTOM exceeded for ${identifier}`);
        return result;
    }

    return { success: true, identifier };
}

/**
 * IP-only rate limiting (ignore user session)
 * Useful for public endpoints
 */
export async function checkIpRateLimit(
    req: NextRequest,
    type: keyof typeof rateLimitConfigs
): Promise<{ success: true; ip: string } | NextResponse> {
    const ip = getClientIp(req);
    const identifier = `ip:${ip}`;
    const ratelimit = rateLimitConfigs[type];

    const result = await applyRateLimit(ratelimit, identifier);

    if (result instanceof NextResponse) {
        console.warn(`[RateLimit] IP ${type.toUpperCase()} exceeded for ${ip}`);
        return result;
    }

    return { success: true, ip };
}

/**
 * User-only rate limiting (requires authentication)
 * Returns 401 if not authenticated
 */
export async function checkUserRateLimit(
    req: NextRequest,
    type: keyof typeof rateLimitConfigs
): Promise<{ success: true; userId: string } | NextResponse> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        const identifier = `user:${session.user.id}`;
        const ratelimit = rateLimitConfigs[type];

        const result = await applyRateLimit(ratelimit, identifier);

        if (result instanceof NextResponse) {
            console.warn(`[RateLimit] USER ${type.toUpperCase()} exceeded for ${session.user.id}`);
            return result;
        }

        return { success: true, userId: session.user.id };
    } catch (error) {
        return NextResponse.json(
            { error: 'UNAUTHORIZED', message: 'Authentication failed' },
            { status: 401 }
        );
    }
}
