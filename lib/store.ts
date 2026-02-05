import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    color?: string;
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
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateItemPrice: (id: string, price: number) => void;
    clearCart: () => void;
    removeInvalidItems: (validIds: Set<string>) => void;
    setCoupon: (coupon: AppliedCoupon) => void;
    removeCoupon: () => void;
    openCart: () => void;
    closeCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            appliedCoupon: null,
            isOpen: false,
            addItem: (item) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((i) => i.id === item.id);
                if (existingItem) {
                    set({
                        items: currentItems.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                        isOpen: true,
                    });
                } else {
                    set({ items: [...currentItems, { ...item, quantity: 1 }], isOpen: true });
                }
            },
            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                })),
            updateQuantity: (id, quantity) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                })),
            updateItemPrice: (id, price) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, price } : i
                    ),
                })),
            clearCart: () => set({ items: [], appliedCoupon: null }),
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
        }),
        {
            name: 'vastra-verse-cart-storage',
        }
    )
);
