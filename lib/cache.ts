/**
 * Redis Cache Service
 * 
 * Production-grade caching abstraction using Upstash Redis.
 * 
 * Features:
 * - Read-through caching with `getOrSet()`
 * - Batch operations with `mget()` / `mset()`
 * - Atomic counters with `incr()` / `decr()`
 * - Key inspection with `exists()` / `ttl()`
 * - Configurable TTL per key
 * - Pattern-based cache invalidation
 * - Cache hit/miss ratio tracking
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
 *   // Batch get
 *   const [prod1, prod2] = await cache.mget<Product>(['products:id:1', 'products:id:2']);
 * 
 *   // Atomic counter
 *   const views = await cache.incr('views:product:abc');
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

/** Expose raw Redis client for advanced use (rate limiting, pub/sub, etc.) */
export function getRawRedis(): Redis {
    return getRedis();
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
    // Products
    PRODUCTS_LIST: 300,        // 5 min
    PRODUCT_DETAIL: 300,       // 5 min
    PRODUCTS_FEATURED: 120,    // 2 min

    // Categories
    CATEGORIES: 600,           // 10 min

    // Store
    STORE_SETTINGS: 600,       // 10 min
    HOMEPAGE_DATA: 60,         // 1 min

    // User / Session
    USER_SESSION: 1800,        // 30 min
    USER_CART: 3600,           // 1 hour
    USER_PREFERENCES: 1800,    // 30 min

    // Orders
    ORDER_DETAIL: 120,         // 2 min (frequently updated)
    ORDER_LIST: 60,            // 1 min
    ORDER_STATUS: 30,          // 30 sec (real-time feel)

    // Search
    SEARCH_RESULTS: 120,       // 2 min

    // API Response Cache
    API_RESPONSE: 60,          // 1 min
    API_RESPONSE_LONG: 300,    // 5 min

    // Idempotency
    IDEMPOTENCY_KEY: 86400,    // 24 hours
} as const;

// ============================================================
// Cache Keys (centralized to prevent typos)
// ============================================================

export const CACHE_KEYS = {
    // Products
    PRODUCTS_ALL: 'products:all',
    PRODUCT_BY_SLUG: (slug: string) => `products:slug:${slug}`,
    PRODUCT_BY_ID: (id: string) => `products:id:${id}`,
    PRODUCTS_FEATURED: 'products:featured',
    PRODUCTS_BY_CATEGORY: (categorySlug: string) => `products:category:${categorySlug}`,
    PRODUCT_VIEWS: (productId: string) => `products:views:${productId}`,

    // Categories
    CATEGORIES_ALL: 'categories:all',
    CATEGORIES_TREE: 'categories:tree',
    CATEGORY_BY_SLUG: (slug: string) => `categories:slug:${slug}`,
    CATEGORY_BY_ID: (id: string) => `categories:id:${id}`,

    // Store
    STORE_SETTINGS: 'store:settings',
    HOMEPAGE_BANNERS: 'homepage:banners',
    HOMEPAGE_FEATURED: 'homepage:featured',

    // User
    USER_CART: (userId: string) => `user:cart:${userId}`,
    USER_PREFS: (userId: string) => `user:prefs:${userId}`,
    USER_ADDRESSES: (userId: string) => `user:addresses:${userId}`,

    // Orders
    ORDER_BY_ID: (orderId: string) => `orders:id:${orderId}`,
    ORDERS_BY_USER: (userId: string) => `orders:user:${userId}`,
    ORDER_STATUS: (orderId: string) => `orders:status:${orderId}`,

    // Search
    SEARCH: (query: string) => `search:${query.toLowerCase().trim()}`,

    // API Response
    API_RESPONSE: (method: string, path: string) => `api:${method}:${path}`,

    // Idempotency
    IDEMPOTENCY: (key: string) => `idempotency:${key}`,
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
 * Batch get multiple keys in one round-trip.
 * Returns array of values (null for misses).
 */
async function mget<T>(...keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    try {
        const redis = getRedis();
        const values = await redis.mget<(T | null)[]>(...keys);

        for (const v of values) {
            if (v !== null && v !== undefined) stats.hits++;
            else stats.misses++;
        }
        return values;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'mget', keyCount: keys.length });
        return keys.map(() => null);
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
 * Batch set multiple key-value pairs with a shared TTL.
 * Uses pipeline for atomicity.
 */
async function mset(entries: { key: string; value: any }[], ttlSeconds?: number): Promise<void> {
    if (entries.length === 0) return;
    try {
        const redis = getRedis();
        const pipeline = redis.pipeline();

        for (const { key, value } of entries) {
            if (ttlSeconds) {
                pipeline.set(key, value, { ex: ttlSeconds });
            } else {
                pipeline.set(key, value);
            }
        }
        await pipeline.exec();

        stats.sets += entries.length;

        // Track keys (non-blocking)
        Promise.all(entries.map(e => trackKey(e.key))).catch(() => { });
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'mset', count: entries.length });
    }
}

/**
 * Atomic increment. Returns the new value.
 * Useful for counters (view counts, rate limiting).
 */
async function incr(key: string): Promise<number> {
    try {
        const redis = getRedis();
        return await redis.incr(key);
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'incr', key });
        return 0;
    }
}

/**
 * Atomic decrement. Returns the new value.
 */
async function decr(key: string): Promise<number> {
    try {
        const redis = getRedis();
        return await redis.decr(key);
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'decr', key });
        return 0;
    }
}

/**
 * Check if a key exists without fetching.
 */
async function exists(key: string): Promise<boolean> {
    try {
        const redis = getRedis();
        const result = await redis.exists(key);
        return result === 1;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'exists', key });
        return false;
    }
}

/**
 * Get remaining TTL (in seconds) for a key.
 * Returns -2 if key doesn't exist, -1 if no expiry set.
 */
async function getTTL(key: string): Promise<number> {
    try {
        const redis = getRedis();
        return await redis.ttl(key);
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'ttl', key });
        return -2;
    }
}

/**
 * Set expiry on an existing key.
 */
async function expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
        const redis = getRedis();
        const result = await redis.expire(key, ttlSeconds);
        return result === 1;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'expire', key });
        return false;
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
 * Delete multiple keys at once.
 */
async function mdel(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
        const redis = getRedis();
        const pipeline = redis.pipeline();
        for (const key of keys) {
            pipeline.del(key);
        }
        await pipeline.exec();
        stats.deletes += keys.length;
    } catch (err) {
        stats.errors++;
        logError('CACHE', err, { operation: 'mdel', count: keys.length });
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
    mget,
    set,
    mset,
    del,
    mdel,
    incr,
    decr,
    exists,
    ttl: getTTL,
    expire,
    invalidatePattern,
    getOrSet,
    getStats,
    resetStats,
};
