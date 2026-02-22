/**
 * Central Cache Tag Registry
 * 
 * SINGLE SOURCE OF TRUTH for all cache tags used across the app.
 * 
 * This prevents the #1 cause of stale data: tag mismatches between
 * `unstable_cache(..., { tags: [...] })` and `revalidateTag(...)`.
 * 
 * RULES:
 * 1. NEVER hardcode tag strings — always import from here
 * 2. Every `unstable_cache` MUST use tags from this registry
 * 3. Every mutation MUST call the corresponding revalidation helper
 * 4. Add new tags here FIRST, then use them in data fetchers
 * 
 * Architecture:
 * ┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
 * │ Data Fetchers│───>│ unstable_cache     │───>│ CACHE_TAGS.*     │
 * │ (lib/data/)  │    │ tags: [TAG]        │    │ (this file)      │
 * └──────────────┘    └───────────────────┘    └──────────────────┘
 *                              ▲                        │
 * ┌──────────────┐    ┌───────────────────┐             │
 * │ API Routes / │───>│ revalidateAllTags │─────────────┘
 * │ Server Acts  │    │ (this file)       │
 * └──────────────┘    └───────────────────┘
 */

import { revalidateTag, revalidatePath } from 'next/cache';
import { cache as redisCache } from '@/lib/cache';
import { logInfo } from '@/lib/logger';

// ============================================================
// Tag Constants — SINGLE SOURCE OF TRUTH
// ============================================================

export const CACHE_TAGS = {
    // Products
    PRODUCTS: 'products',
    NEW_ARRIVALS: 'new-arrivals',
    BEST_SELLERS: 'best-sellers',

    // Categories
    CATEGORIES: 'categories',

    // Banners
    BANNERS: 'banners',

    // Stories
    STORIES: 'stories',

    // Social Wall
    SOCIALS: 'socials',

    // Orders
    ORDERS: 'orders',

    // Notifications
    NOTIFICATIONS: 'notifications',

    // Settings
    SETTINGS: 'settings',

    // Inventory
    INVENTORY: 'inventory',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

/** All tags as an array — for bulk invalidation */
export const ALL_CACHE_TAGS: CacheTag[] = Object.values(CACHE_TAGS);

// ============================================================
// Revalidation Helpers — Invalidates BOTH Next.js + Redis cache
// ============================================================

/**
 * Invalidate Next.js unstable_cache tags.
 * Handles the `revalidateTag` call safely.
 */
export function revalidateNextTags(tags: CacheTag[]): void {
    for (const tag of tags) {
        try {
            revalidateTag(tag, {} as any);
        } catch (err) {
            // revalidateTag can throw if called outside request context
            // in dev mode — log but don't crash
            console.warn(`[CACHE] revalidateTag('${tag}') failed:`, err);
        }
    }
}

/**
 * Invalidate Redis cache keys by pattern.
 * Non-blocking — errors are logged but don't throw.
 */
async function invalidateRedisPatterns(patterns: string[]): Promise<void> {
    try {
        await Promise.all(patterns.map(p => redisCache.invalidatePattern(p)));
    } catch {
        // Redis may not be configured — that's OK
    }
}

// ============================================================
// Domain-Specific Revalidation Functions
// ============================================================

/** Invalidate all product-related caches */
export async function revalidateProducts(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.PRODUCTS, CACHE_TAGS.NEW_ARRIVALS, CACHE_TAGS.BEST_SELLERS]);
    await invalidateRedisPatterns(['products:*']);
    try { revalidatePath('/', 'page'); } catch (e) { console.warn('[CACHE] revalidatePath failed (likely called during render)'); }
    logInfo('CACHE_REVALIDATION', 'Products cache invalidated (Next.js + Redis)');
}

/** Invalidate all category-related caches */
export async function revalidateCategories(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.CATEGORIES]);
    await invalidateRedisPatterns(['categories:*']);
    try { revalidatePath('/', 'page'); } catch (e) { console.warn('[CACHE] revalidatePath failed (likely called during render)'); }
    logInfo('CACHE_REVALIDATION', 'Categories cache invalidated (Next.js + Redis)');
}

/** Invalidate all banner-related caches */
export async function revalidateBanners(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.BANNERS]);
    await invalidateRedisPatterns(['banners:*']);
    try { revalidatePath('/', 'page'); } catch (e) { console.warn('[CACHE] revalidatePath failed (likely called during render)'); }
    logInfo('CACHE_REVALIDATION', 'Banners cache invalidated (Next.js + Redis)');
}

/** Invalidate all story-related caches */
export async function revalidateStories(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.STORIES]);
    await invalidateRedisPatterns(['stories:*']);
    try { revalidatePath('/', 'page'); } catch (e) { console.warn('[CACHE] revalidatePath failed (likely called during render)'); }
    logInfo('CACHE_REVALIDATION', 'Stories cache invalidated (Next.js + Redis)');
}

/** Invalidate all social wall caches */
export async function revalidateSocials(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.SOCIALS]);
    await invalidateRedisPatterns(['socials:*']);
    try { revalidatePath('/', 'page'); } catch (e) { console.warn('[CACHE] revalidatePath failed (likely called during render)'); }
    logInfo('CACHE_REVALIDATION', 'Socials cache invalidated (Next.js + Redis)');
}

/** Invalidate order-related caches */
export async function revalidateOrders(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.ORDERS]);
    await invalidateRedisPatterns(['orders:*']);
    logInfo('CACHE_REVALIDATION', 'Orders cache invalidated (Next.js + Redis)');
}

/** Invalidate notification caches */
export async function revalidateNotifications(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.NOTIFICATIONS]);
    await invalidateRedisPatterns(['notifications:*']);
    logInfo('CACHE_REVALIDATION', 'Notifications cache invalidated (Next.js + Redis)');
}

/** Invalidate settings caches */
export async function revalidateSettings(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.SETTINGS]);
    await invalidateRedisPatterns(['store:*']);
    logInfo('CACHE_REVALIDATION', 'Settings cache invalidated (Next.js + Redis)');
}

/** Invalidate inventory caches */
export async function revalidateInventory(): Promise<void> {
    revalidateNextTags([CACHE_TAGS.INVENTORY, CACHE_TAGS.PRODUCTS]);
    await invalidateRedisPatterns(['products:*', 'inventory:*']);
    logInfo('CACHE_REVALIDATION', 'Inventory cache invalidated (Next.js + Redis)');
}

// ============================================================
// Nuclear Option — Invalidate EVERYTHING
// ============================================================

/**
 * Invalidate ALL caches across the entire application.
 * Use for: DB reset, emergency recovery, post-migration.
 * 
 * This is the "nuclear button" — use sparingly in production.
 */
export async function revalidateAll(): Promise<void> {
    // Invalidate all Next.js cache tags
    revalidateNextTags(ALL_CACHE_TAGS);

    // Invalidate all Redis cache patterns
    await invalidateRedisPatterns([
        'products:*',
        'categories:*',
        'banners:*',
        'stories:*',
        'socials:*',
        'orders:*',
        'notifications:*',
        'store:*',
        'homepage:*',
        'search:*',
    ]);

    // Revalidate all paths
    revalidatePath('/', 'layout');

    logInfo('CACHE_REVALIDATION', '🔥 FULL CACHE FLUSH — all tags + Redis + paths invalidated');
}

// ============================================================
// Prisma Model → Tag Mapping (for auto-revalidation middleware)
// ============================================================

/**
 * Maps Prisma model names to the cache tags that should be
 * invalidated when that model is modified.
 */
export const MODEL_TO_TAGS: Record<string, CacheTag[]> = {
    Product: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.NEW_ARRIVALS, CACHE_TAGS.BEST_SELLERS],
    ProductImage: [CACHE_TAGS.PRODUCTS],
    Category: [CACHE_TAGS.CATEGORIES],
    HeroBanner: [CACHE_TAGS.BANNERS],
    Story: [CACHE_TAGS.STORIES],
    SocialImage: [CACHE_TAGS.SOCIALS],
    SocialVideo: [CACHE_TAGS.SOCIALS],
    Order: [CACHE_TAGS.ORDERS],
    OrderItem: [CACHE_TAGS.ORDERS],
    Notification: [CACHE_TAGS.NOTIFICATIONS],
    StoreSettings: [CACHE_TAGS.SETTINGS],
};

/** Write operations that should trigger cache invalidation */
export const WRITE_ACTIONS = new Set([
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
    'delete',
    'deleteMany',
]);
