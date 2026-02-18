/**
 * Category Cache — Typed caching helpers for category data.
 *
 * Categories change rarely so they get longer TTLs (10 min).
 *
 * Usage:
 *   import { getCachedCategories, getCachedCategory } from '@/lib/cache/category-cache';
 */

import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import prisma from '@/lib/prisma';
import { logInfo } from '@/lib/logger';

// ─── All Categories ───────────────────────────────────────────────────────────

/**
 * Get all active categories. 10-minute cache.
 */
export async function getCachedCategories() {
    return cache.getOrSet(
        CACHE_KEYS.CATEGORIES_ALL,
        async () => {
            return prisma.category.findMany({
                where: { isActive: true },
                include: {
                    _count: { select: { products: true } },
                },
                orderBy: { displayOrder: 'asc' },
            });
        },
        CACHE_TTL.CATEGORIES,
    );
}

// ─── Featured Categories ─────────────────────────────────────────────────────

/**
 * Get featured categories for navigation and homepage.
 */
export async function getCachedFeaturedCategories() {
    return cache.getOrSet(
        CACHE_KEYS.CATEGORIES_TREE,
        async () => {
            return prisma.category.findMany({
                where: { isActive: true, isFeatured: true },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                    displayOrder: true,
                    _count: { select: { products: true } },
                },
                orderBy: { displayOrder: 'asc' },
            });
        },
        CACHE_TTL.CATEGORIES,
    );
}

// ─── Single Category ──────────────────────────────────────────────────────────

/**
 * Get a single category by slug. Cache-through.
 */
export async function getCachedCategory(slug: string) {
    return cache.getOrSet(
        CACHE_KEYS.CATEGORY_BY_SLUG(slug),
        async () => {
            return prisma.category.findUnique({
                where: { slug },
                include: {
                    _count: { select: { products: true } },
                },
            });
        },
        CACHE_TTL.CATEGORIES,
    );
}

/**
 * Get a single category by ID. Cache-through.
 */
export async function getCachedCategoryById(id: string) {
    return cache.getOrSet(
        CACHE_KEYS.CATEGORY_BY_ID(id),
        async () => {
            return prisma.category.findUnique({
                where: { id },
                include: {
                    _count: { select: { products: true } },
                },
            });
        },
        CACHE_TTL.CATEGORIES,
    );
}

// ─── Cache Warming ────────────────────────────────────────────────────────────

/**
 * Pre-warm category cache on startup.
 */
export async function warmCategoryCache() {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { products: true } } },
        orderBy: { displayOrder: 'asc' },
    });

    // Warm the "all" key
    await cache.set(CACHE_KEYS.CATEGORIES_ALL, categories, CACHE_TTL.CATEGORIES);

    // Warm individual slug keys
    const entries = categories.map(c => ({
        key: CACHE_KEYS.CATEGORY_BY_SLUG(c.slug),
        value: c,
    }));
    await cache.mset(entries, CACHE_TTL.CATEGORIES);

    logInfo('CATEGORY_CACHE', `Warmed cache for ${categories.length} categories`);
}
