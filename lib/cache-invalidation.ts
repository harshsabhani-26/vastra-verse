/**
 * Centralized Cache Invalidation
 * 
 * Call these functions when data changes to keep the cache fresh.
 * Each function invalidates the relevant cache keys and optionally
 * triggers Next.js path revalidation.
 * 
 * Usage:
 *   import { invalidateProducts, invalidateCategories } from '@/lib/cache-invalidation';
 * 
 *   // After creating/updating/deleting a product:
 *   await invalidateProducts();
 * 
 *   // After updating a specific product:
 *   await invalidateProduct('product-slug');
 */

import { cache, CACHE_KEYS } from '@/lib/cache';
import { logInfo } from '@/lib/logger';

// ============================================================
// Product Cache Invalidation
// ============================================================

/**
 * Invalidate all product caches.
 * Call after bulk operations (import, batch update, etc.)
 */
export async function invalidateProducts(): Promise<void> {
    await Promise.all([
        cache.del(CACHE_KEYS.PRODUCTS_ALL),
        cache.invalidatePattern('products:*'),
        cache.del(CACHE_KEYS.HOMEPAGE_FEATURED),
    ]);
    logInfo('CACHE_INVALIDATION', 'Products cache invalidated');
}

/**
 * Invalidate a specific product's cache.
 * Call after single product create/update/delete.
 */
export async function invalidateProduct(slugOrId: string): Promise<void> {
    await Promise.all([
        cache.del(CACHE_KEYS.PRODUCTS_ALL),
        cache.del(CACHE_KEYS.PRODUCT_BY_SLUG(slugOrId)),
        cache.del(CACHE_KEYS.PRODUCT_BY_ID(slugOrId)),
        cache.del(CACHE_KEYS.HOMEPAGE_FEATURED),
    ]);
    logInfo('CACHE_INVALIDATION', `Product "${slugOrId}" cache invalidated`);
}

// ============================================================
// Category Cache Invalidation
// ============================================================

/**
 * Invalidate all category caches.
 */
export async function invalidateCategories(): Promise<void> {
    await Promise.all([
        cache.del(CACHE_KEYS.CATEGORIES_ALL),
        cache.invalidatePattern('categories:*'),
    ]);
    logInfo('CACHE_INVALIDATION', 'Categories cache invalidated');
}

/**
 * Invalidate a specific category's cache.
 */
export async function invalidateCategory(slugOrId: string): Promise<void> {
    await Promise.all([
        cache.del(CACHE_KEYS.CATEGORIES_ALL),
        cache.del(CACHE_KEYS.CATEGORY_BY_SLUG(slugOrId)),
    ]);
    logInfo('CACHE_INVALIDATION', `Category "${slugOrId}" cache invalidated`);
}

// ============================================================
// Store Settings Cache Invalidation
// ============================================================

/**
 * Invalidate store settings cache.
 * Call after admin changes settings.
 */
export async function invalidateStoreSettings(): Promise<void> {
    await cache.del(CACHE_KEYS.STORE_SETTINGS);
    logInfo('CACHE_INVALIDATION', 'Store settings cache invalidated');
}

// ============================================================
// Homepage Cache Invalidation
// ============================================================

/**
 * Invalidate homepage caches.
 * Call after banner/featured product changes.
 */
export async function invalidateHomepage(): Promise<void> {
    await Promise.all([
        cache.del(CACHE_KEYS.HOMEPAGE_BANNERS),
        cache.del(CACHE_KEYS.HOMEPAGE_FEATURED),
    ]);
    logInfo('CACHE_INVALIDATION', 'Homepage cache invalidated');
}

// ============================================================
// Full Cache Flush
// ============================================================

/**
 * Invalidate ALL application caches.
 * Use sparingly — for emergency or bulk operations only.
 */
export async function invalidateAll(): Promise<void> {
    await Promise.all([
        cache.invalidatePattern('products:*'),
        cache.invalidatePattern('categories:*'),
        cache.del(CACHE_KEYS.STORE_SETTINGS),
        cache.del(CACHE_KEYS.HOMEPAGE_BANNERS),
        cache.del(CACHE_KEYS.HOMEPAGE_FEATURED),
    ]);
    logInfo('CACHE_INVALIDATION', 'Full cache flush completed');
}
