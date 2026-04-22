"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist-store";

/**
 * CartHydration
 * 
 * Zustand's persist middleware stores cart data in localStorage.
 * On the server, localStorage doesn't exist, so Next.js renders an empty cart.
 * On the client, Zustand needs to rehydrate (load from localStorage) after mount.
 * 
 * Without this component, you'd get a React hydration mismatch warning.
 * This component safely triggers rehydration AFTER the first client render,
 * ensuring the cart state snaps to the persisted values without errors.
 */
export function CartHydration() {
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;

        // Rehydrate cart from localStorage
        const cartPersist = useCartStore.persist;
        if (cartPersist && typeof cartPersist.rehydrate === "function") {
            cartPersist.rehydrate();
        }

        // Rehydrate wishlist from localStorage
        const wishlistPersist = useWishlistStore.persist;
        if (wishlistPersist && typeof wishlistPersist.rehydrate === "function") {
            wishlistPersist.rehydrate();
        }
    }, []);

    // Renders nothing — purely a side-effect component
    return null;
}
