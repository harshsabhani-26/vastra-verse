/**
 * Product Cache — Typed caching helpers for product data.
 *
 * Wraps the generic cache service with product-specific keys, TTLs,
 * and Prisma queries.  Every function is safe to call even when Redis
 * is unreachable (falls back to DB).
 *
 * Usage:
 *   import { getCachedProducts, getCachedProductById } from '@/lib/cache/product-cache';
 */

import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import prisma from '@/lib/prisma';
import { logInfo } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFilter {
    categoryId?: string;
    featured?: boolean;
    take?: number;
    skip?: number;
    status?: string;
}

// ─── Product List ─────────────────────────────────────────────────────────────

/**
 * Get a list of products. Reads from cache first, falls back to DB.
 */
export async function getCachedProducts(filters: ProductFilter = {}) {
    const { categoryId, featured, take = 50, skip = 0, status = 'ACTIVE' } = filters;

    // Build a deterministic cache key from filters
    const keyParts = ['products'];
    if (categoryId) keyParts.push(`cat:${categoryId}`);
    if (featured) keyParts.push('featured');
    keyParts.push(`t${take}:s${skip}`);
    const cacheKey = keyParts.join(':');

    return cache.getOrSet(
        cacheKey,
        async () => {
            const where: any = { status };
            if (categoryId) {
                where.categoryId = categoryId;
            }
            if (featured) {
                where.isFeatured = true;
            }

            return prisma.product.findMany({
                where,
                take,
                skip,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    images: { select: { id: true, url: true, type: true, position: true }, orderBy: { position: 'asc' } },
                },
                orderBy: { createdAt: 'desc' },
            });
        },
        featured ? CACHE_TTL.PRODUCTS_FEATURED : CACHE_TTL.PRODUCTS_LIST,
    );
}

// ─── Single Product ───────────────────────────────────────────────────────────

/**
 * Get a single product by ID. Cache-through.
 */
export async function getCachedProductById(id: string) {
    return cache.getOrSet(
        CACHE_KEYS.PRODUCT_BY_ID(id),
        async () => {
            return prisma.product.findUnique({
                where: { id },
                include: {
                    category: true,
                    images: { orderBy: { position: 'asc' } },
                },
            });
        },
        CACHE_TTL.PRODUCT_DETAIL,
    );
}

// ─── Featured Products ────────────────────────────────────────────────────────

/**
 * Get featured products for homepage.
 */
export async function getCachedFeaturedProducts(limit = 8) {
    return cache.getOrSet(
        CACHE_KEYS.PRODUCTS_FEATURED,
        async () => {
            return prisma.product.findMany({
                where: { status: 'ACTIVE', isFeatured: true },
                take: limit,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    images: { where: { type: 'MAIN' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
            });
        },
        CACHE_TTL.PRODUCTS_FEATURED,
    );
}

// ─── Cache Warming ────────────────────────────────────────────────────────────

/**
 * Pre-warm product cache with an array of products (e.g., after deploy).
 * Uses batch mset for efficiency.
 */
export async function warmProductCache(products: Array<{ id: string;[key: string]: any }>) {
    if (products.length === 0) return;

    const entries = products.map(p => ({
        key: CACHE_KEYS.PRODUCT_BY_ID(p.id),
        value: p,
    }));

    await cache.mset(entries, CACHE_TTL.PRODUCT_DETAIL);
    logInfo('PRODUCT_CACHE', `Warmed cache for ${products.length} products`);
}

