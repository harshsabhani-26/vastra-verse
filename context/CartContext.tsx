'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    isOpen: boolean;
    toggleCart: () => void;
    addToCart: (product: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Initialize with some dummy data for demo purposes
    useEffect(() => {
        // In a real app, check localStorage here
    }, []);

    const toggleCart = () => setIsOpen(prev => !prev);

    const addToCart = (product: CartItem) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + product.quantity }
                        : item
                );
            }
            return [...prev, product];
        });
        setIsOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, isOpen, toggleCart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
