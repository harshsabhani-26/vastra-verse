/**
 * Session & User Cache — Cart state, user preferences, addresses.
 *
 * Stores ephemeral user data in Redis for fast access.
 * Falls back gracefully when Redis is unavailable.
 *
 * Usage:
 *   import { getCachedCart, setCachedCart } from '@/lib/cache/session-cache';
 */

import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { logInfo } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
    size?: string;
}

export interface UserPreferences {
    currency?: string;
    language?: string;
    theme?: 'light' | 'dark';
    recentlyViewed?: string[];
    notificationPrefs?: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
}

// ─── Cart Cache ───────────────────────────────────────────────────────────────

/**
 * Get the user's cached cart items.
 * Returns null if no cached cart.
 */
export async function getCachedCart(userId: string): Promise<CartItem[] | null> {
    return cache.get<CartItem[]>(CACHE_KEYS.USER_CART(userId));
}

/**
 * Set the user's cart in cache (1-hour TTL).
 */
export async function setCachedCart(userId: string, items: CartItem[]): Promise<void> {
    await cache.set(CACHE_KEYS.USER_CART(userId), items, CACHE_TTL.USER_CART);
}

/**
 * Invalidate the user's cart cache (e.g., after checkout).
 */
export async function invalidateCart(userId: string): Promise<void> {
    await cache.del(CACHE_KEYS.USER_CART(userId));
}

// ─── User Preferences ─────────────────────────────────────────────────────────

/**
 * Get user preferences from cache.
 */
export async function getCachedUserPrefs(userId: string): Promise<UserPreferences | null> {
    return cache.get<UserPreferences>(CACHE_KEYS.USER_PREFS(userId));
}

/**
 * Set user preferences in cache (30-min TTL).
 */
export async function setCachedUserPrefs(userId: string, prefs: UserPreferences): Promise<void> {
    await cache.set(CACHE_KEYS.USER_PREFS(userId), prefs, CACHE_TTL.USER_PREFERENCES);
}

// ─── User Addresses ───────────────────────────────────────────────────────────

/**
 * Get cached user addresses.
 */
export async function getCachedAddresses(userId: string): Promise<any[] | null> {
    return cache.get<any[]>(CACHE_KEYS.USER_ADDRESSES(userId));
}

/**
 * Set user addresses in cache (30-min TTL).
 */
export async function setCachedAddresses(userId: string, addresses: any[]): Promise<void> {
    await cache.set(CACHE_KEYS.USER_ADDRESSES(userId), addresses, CACHE_TTL.USER_PREFERENCES);
}

/**
 * Invalidate user addresses cache.
 */
export async function invalidateAddresses(userId: string): Promise<void> {
    await cache.del(CACHE_KEYS.USER_ADDRESSES(userId));
}

// ─── Invalidate All User Data ─────────────────────────────────────────────────

/**
 * Clear all cached data for a user (logout, account delete).
 */
export async function invalidateUserCache(userId: string): Promise<void> {
    await cache.mdel(
        CACHE_KEYS.USER_CART(userId),
        CACHE_KEYS.USER_PREFS(userId),
        CACHE_KEYS.USER_ADDRESSES(userId),
    );
    logInfo('SESSION_CACHE', `User cache cleared: ${userId}`);
}
