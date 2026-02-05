/**
 * SECURITY: Rate Limiting Configuration
 * 
 * Protects API endpoints from:
 * - Brute force attacks
 * - API abuse
 * - DoS attacks
 * 
 * If Upstash Redis is not configured, falls back to in-memory rate limiting
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development
class InMemoryRateLimiter {
    private requests: Map<string, { count: number; resetTime: number }> = new Map();
    private limitCount: number;
    private window: number;

    constructor(opts: { requests: number; window: string }) {
        this.limitCount = opts.requests;
        // Parse window (e.g., "10 s", "1 m")
        const match = opts.window.match(/(\d+)\s*([sm])/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            this.window = unit === 's' ? value * 1000 : value * 60 * 1000;
        } else {
            this.window = 60000; // Default 1 minute
        }
    }

    async limit(identifier: string) {
        const now = Date.now();
        const record = this.requests.get(identifier);
        if (!record || now > record.resetTime) {
            this.requests.set(identifier, { count: 1, resetTime: now + this.window });
            return {
                success: true,
                remaining: this.limitCount - 1,
                limit: this.limitCount,
                reset: now + this.window
            };
        }

        if (record.count >= this.limitCount) {
            return {
                success: false,
                remaining: 0,
                limit: this.limitCount,
                reset: record.resetTime
            };
        }

        record.count++;
        return {
            success: true,
            remaining: this.limitCount - record.count,
            limit: this.limitCount,
            reset: record.resetTime
        };
    }
}

// Try to use Upstash Redis if configured, otherwise use in-memory
let ratelimit: Ratelimit | InMemoryRateLimiter;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        // Production: Upstash Redis
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        ratelimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
            analytics: true,
            prefix: "@upstash/ratelimit",
        });
    } else {
        console.warn("Upstash Redis not configured, using in-memory rate limiting");
        ratelimit = new InMemoryRateLimiter({ requests: 10, window: "10 s" });
    }
} catch (error) {
    console.error("Failed to initialize rate limiter, using in-memory fallback:", error);
    ratelimit = new InMemoryRateLimiter({ requests: 10, window: "10 s" });
}

export { ratelimit };

/**
 * Get rate limiter for specific use cases
 */
export function getAuthRateLimiter() {
    // Stricter for auth endpoints: 5 requests per minute
    try {
        if (process.env.UPSTASH_REDIS_REST_URL) {
            return new Ratelimit({
                redis: new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL!,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
                }),
                limiter: Ratelimit.slidingWindow(5, "60 s"),
                analytics: true,
            });
        }
    } catch { }

    return new InMemoryRateLimiter({ requests: 5, window: "60 s" });
}

export function getPaymentRateLimiter() {
    // Very strict for payment endpoints: 3 requests per minute
    try {
        if (process.env.UPSTASH_REDIS_REST_URL) {
            return new Ratelimit({
                redis: new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL!,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
                }),
                limiter: Ratelimit.slidingWindow(3, "60 s"),
                analytics: true,
            });
        }
    } catch { }

    return new InMemoryRateLimiter({ requests: 3, window: "60 s" });
}
