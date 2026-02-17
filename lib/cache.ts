/**
 * Redis Cache Service
 * 
 * Production-grade caching abstraction using Upstash Redis.
 * 
 * Features:
 * - Read-through caching with `getOrSet()`
 * - Configurable TTL per key
 * - Pattern-based cache invalidation
 * - Cache hit/miss ratio tracking via metrics service
 * - Non-blocking writes (fire-and-forget)
 * - JSON serialization built-in
 * 
 * Usage:
 *   import { cache } from '@/lib/cache';
 * 
 *   // Read-through: fetch from cache or DB
 *   const products = await cache.getOrSet('products:all', async () => {
 *       return prisma.product.findMany();
 *   }, 300); // 5 min TTL
 * 
 *   // Manual set/get
 *   await cache.set('store:settings', settings, 600);
 *   const settings = await cache.get<StoreSettings>('store:settings');
 * 
 *   // Invalidate
 *   await cache.del('products:all');
 *   await cache.invalidatePattern('products:*');
 */

import { Redis } from '@upstash/redis';
import { logError, logInfo } from '@/lib/logger';

// ============================================================
// Redis Client
// ============================================================

let redisClient: Redis | null = null;

function getRedis(): Redis {
    if (!redisClient) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for caching');
        }

        redisClient = new Redis({ url, token });
    }
    return redisClient;
}

// ============================================================
// Cache Stats (in-memory, reset on restart)
// ============================================================

const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
};

// ============================================================
// Default TTL Configuration (seconds)
// ============================================================

export const CACHE_TTL = {
    PRODUCTS_LIST: 300,       // 5 min
    PRODUCT_DETAIL: 300,      // 5 min
    CATEGORIES: 600,          // 10 min
    STORE_SETTINGS: 600,      // 10 min
    HOMEPAGE_DATA: 60,        // 1 min
    USER_SESSION: 1800,       // 30 min
    SEARCH_RESULTS: 120,      // 2 min
} as const;

// ============================================================
// Cache Keys (centralized to prevent typos)
// ============================================================

export const CACHE_KEYS = {
    PRODUCTS_ALL: 'products:all',
    PRODUCT_BY_SLUG: (slug: string) => `products:slug:${slug}`,
    PRODUCT_BY_ID: (id: string) => `products:id:${id}`,
    CATEGORIES_ALL: 'categories:all',
    CATEGORY_BY_SLUG: (slug: string) => `categories:slug:${slug}`,
    STORE_SETTINGS: 'store:settings',
    HOMEPAGE_BANNERS: 'homepage:banners',
    HOMEPAGE_FEATURED: 'homepage:featured',
} as const;

// ============================================================
// Core Cache Operations
// ============================================================

/**
 * Get a value from cache.
 * Returns null on miss or error (never throws).
 */
async function get<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedis();
        const value = await redis.get<T>(key);

        if (value !== null && value !== undefined) {
            stats.hits++;
            return value;
        }

        stats.misses++;
        return null;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'get', key });
        return null;
    }
}

/**
 * Set a value in cache with TTL.
 * Non-blocking — errors are logged but not thrown.
 */
async function set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
        const redis = getRedis();

        if (ttlSeconds) {
            await redis.set(key, value, { ex: ttlSeconds });
        } else {
            await redis.set(key, value);
        }

        stats.sets++;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'set', key });
    }
}

/**
 * Delete a specific cache key.
 */
async function del(key: string): Promise<void> {
    try {
        const redis = getRedis();
        await redis.del(key);
        stats.deletes++;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'del', key });
    }
}

/**
 * Delete multiple keys matching a pattern.
 * Uses SCAN to avoid blocking Redis.
 * 
 * ⚠️ Upstash REST API doesn't support SCAN/KEYS patterns directly.
 * This uses a key-tracking approach: we maintain a set of known keys per prefix.
 */
async function invalidatePattern(pattern: string): Promise<number> {
    try {
        const redis = getRedis();
        // Extract prefix from pattern (e.g., "products:*" → "products")
        const prefix = pattern.replace(/\*$/, '');
        const trackingKey = `_cache_keys:${prefix}`;

        const keys = await redis.smembers(trackingKey) as string[];
        if (keys.length === 0) return 0;

        // Delete all tracked keys + the tracking set
        const pipeline = redis.pipeline();
        for (const key of keys) {
            pipeline.del(key);
        }
        pipeline.del(trackingKey);
        await pipeline.exec();

        stats.deletes += keys.length;
        logInfo('CACHE', `Invalidated ${keys.length} keys matching "${pattern}"`, { count: keys.length });
        return keys.length;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'invalidatePattern', pattern });
        return 0;
    }
}

/**
 * Track a cache key in a set for pattern invalidation.
 * Called internally after every set().
 */
async function trackKey(key: string): Promise<void> {
    try {
        const redis = getRedis();
        // Extract prefix (everything before the last colon segment)
        const parts = key.split(':');
        if (parts.length >= 2) {
            const prefix = parts[0] + ':';
            await redis.sadd(`_cache_keys:${prefix}`, key);
        }
    } catch {
        // Silent — tracking is best-effort
    }
}

/**
 * Read-through cache: get from cache, or fetch and store.
 * This is the primary method for most use cases.
 * 
 * @param key - Cache key
 * @param fetchFn - Async function to compute the value on cache miss
 * @param ttlSeconds - Time-to-live in seconds
 * @returns The cached or freshly computed value
 */
async function getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    // Try cache first
    const cached = await get<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Cache miss — fetch fresh data
    const freshData = await fetchFn();

    // Store in cache (non-blocking)
    set(key, freshData, ttlSeconds).then(() => trackKey(key)).catch(() => { });

    return freshData;
}

/**
 * Get current cache stats.
 */
function getStats() {
    const total = stats.hits + stats.misses;
    return {
        ...stats,
        total,
        hitRate: total > 0 ? Math.round((stats.hits / total) * 100) : 0,
    };
}

/**
 * Reset cache stats (for monitoring dashboard).
 */
function resetStats() {
    stats.hits = 0;
    stats.misses = 0;
    stats.sets = 0;
    stats.deletes = 0;
    stats.errors = 0;
}

// ============================================================
// Public API
// ============================================================

export const cache = {
    get,
    set,
    del,
    invalidatePattern,
    getOrSet,
    getStats,
    resetStats,
};
