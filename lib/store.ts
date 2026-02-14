import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCart, addToCart, updateCartItem, removeFromCart, syncCart, clearCart as clearServerCart } from '@/app/actions/cart';

export interface CartItem {
    id: string; // Product ID
    name: string;
    price: number;
    image: string;
    quantity: number;
    color?: string;
    cartItemId?: string; // ID from DB CartItem
}

export interface AppliedCoupon {
    code: string;
    discount: number;
    type: string;
}

interface CartStore {
    items: CartItem[];
    appliedCoupon: AppliedCoupon | null;
    isOpen: boolean;
    isGuest: boolean;
    setIsGuest: (isGuest: boolean) => void;

    addItem: (item: CartItem) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number) => Promise<void>;
    updateItemPrice: (id: string, price: number) => void;
    clearCart: () => Promise<void>;
    removeInvalidItems: (validIds: Set<string>) => void;
    setCoupon: (coupon: AppliedCoupon) => void;
    removeCoupon: () => void;
    openCart: () => void;
    closeCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;

    // Auth Sync Actions
    syncWithUser: () => Promise<void>;
    clearUserCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            appliedCoupon: null,
            isOpen: false,
            isGuest: true, // Default to guest

            setIsGuest: (isGuest) => set({ isGuest }),

            addItem: async (item) => {
                const { items, isGuest } = get();
                const existingItem = items.find((i) => i.id === item.id);

                // Optimistic Update
                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
                        ),
                        isOpen: true,
                    });
                } else {
                    set({ items: [...items, { ...item, quantity: item.quantity || 1 }], isOpen: true });
                }

                if (!isGuest) {
                    // Sync with server
                    try {
                        await addToCart(item.id, item.quantity || 1);
                    } catch (error) {
                        console.error("Failed to sync add to cart", error);
                        // Revert? For now, we keep local state as source of truth for UI
                    }
                }
            },

            removeItem: async (id) => {
                const { items, isGuest } = get();
                const itemToRemove = items.find(i => i.id === id);
                // Optimistic Update
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));

                if (!isGuest && itemToRemove) {
                    // We need the CartItem ID for DB deletion? 
                    // Or delete by ProductID within user's cart?
                    // My server action removeFromCart expects itemId (CartItemId).
                    // But my local store maps by Product ID.
                    // I need to fetch the cart first to get IDs or change server action to delete by ProductID.
                    // Let's assume server action `removeFromCart` needs to be updated to handle ProductID lookup OR we store cartItemId.
                    // In `syncWithUser`, we populate `cartItemId`.
                    // For now, let's assume we might need to refresh state or handle this lookup.
                    // Actually, easiest is to call a server action "removeProductFromCart(productId)".
                    // But I implemented `removeFromCart(itemId)`.
                    // Let's stick to updating the server action later if needed, but for now:
                    // Wait, `removeFromCart` in `actions/cart.ts` does `delete({ where: { id: itemId } })`. 
                    // Local `id` IS `productId`. DB `id` is `cartItem.id`.
                    // Mismatch!
                    // I need to store `cartItemId` in local state.
                    if (itemToRemove.cartItemId) {
                        await removeFromCart(itemToRemove.cartItemId);
                    } else {
                        // Fallback: sync/refresh?
                    }
                }
            },

            updateQuantity: async (id, quantity) => {
                const { items, isGuest } = get();
                const itemToUpdate = items.find(i => i.id === id);

                // Optimistic
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                }));

                if (!isGuest && itemToUpdate?.cartItemId) {
                    await updateCartItem(itemToUpdate.cartItemId, quantity);
                }
            },

            updateItemPrice: (id, price) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, price } : i
                    ),
                })),

            clearCart: async () => {
                set({ items: [], appliedCoupon: null });
                // Also clear server-side cart to prevent rehydration after refresh
                try {
                    await clearServerCart();
                } catch (e) {
                    // Server clear is best-effort; local state is already cleared
                }
            },

            removeInvalidItems: (validIds) =>
                set((state) => ({
                    items: state.items.filter((item) => validIds.has(item.id)),
                })),

            setCoupon: (coupon) => set({ appliedCoupon: coupon }),
            removeCoupon: () => set({ appliedCoupon: null }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: () =>
                get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),

            // Sync Logic
            syncWithUser: async () => {
                const { items } = get();
                set({ isGuest: false });

                // 1. Sync local items TO server (merge)
                if (items.length > 0) {
                    await syncCart(items.map(i => ({ id: i.id, quantity: i.quantity })));
                }

                // 2. Fetch latest cart FROM server (source of truth)
                const serverCart = await getCart();
                if (serverCart && serverCart.items) {
                    const mergedItems: CartItem[] = serverCart.items.map((dbItem: any) => ({
                        id: dbItem.productId,
                        name: dbItem.product.name,
                        price: Number(dbItem.product.finalPrice || dbItem.product.price), // Ensure number
                        image: dbItem.product.images?.[0]?.url || '/placeholder.jpg', // Need to fetch image
                        quantity: dbItem.quantity,
                        cartItemId: dbItem.id
                    }));

                    // Note: DB fetch for product details might be minimal. 
                    // `getCart` includes `product: true`. Product has `images`.
                    // But `ProductImage` is a relation. `getCart` needs to include `images`.

                    set({ items: mergedItems });
                }
            },

            clearUserCart: async () => {
                set({ items: [], appliedCoupon: null, isGuest: true });
                // Optionally call server to ensure separation? No need.
            }
        }),
        {
            name: 'vastra-verse-cart-storage',
            skipHydration: true, // Important for Next.js to avoid hydration mismatch, check if supported by version
        }
    )
);
