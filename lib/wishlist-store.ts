import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getWishlist } from '@/app/actions/account';

export interface WishlistItem {
    id: string; // Product ID
}

interface WishlistStore {
    items: WishlistItem[];
    isGuest: boolean;
    setIsGuest: (isGuest: boolean) => void;

    addItem: (productId: string) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    totalItems: () => number;

    // Auth Sync Actions
    syncWithUser: () => Promise<void>;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],
            isGuest: true,

            setIsGuest: (isGuest) => set({ isGuest }),

            addItem: (productId) => {
                const { items } = get();
                const exists = items.some(item => item.id === productId);
                if (!exists) {
                    set({ items: [...items, { id: productId }] });
                }
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter(item => item.id !== productId)
                }));
            },

            isInWishlist: (productId) => {
                return get().items.some(item => item.id === productId);
            },

            totalItems: () => get().items.length,

            // Sync Logic — fetches from server and replaces local state
            syncWithUser: async () => {
                set({ isGuest: false });

                try {
                    const serverWishlist = await getWishlist();
                    if (serverWishlist) {
                        const wishlistItems: WishlistItem[] = serverWishlist.map((item: any) => ({
                            id: item.productId
                        }));
                        set({ items: wishlistItems });
                    }
                } catch (error) {
                    console.error("Failed to sync wishlist", error);
                }
            },

            clearWishlist: () => {
                set({ items: [], isGuest: true });
            }
        }),
        {
            name: 'vastra-verse-wishlist-storage',
            // Don't skip hydration — let the store load from localStorage automatically
            // This fixes the bug where persisted wishlist items were never restored
        }
    )
);
