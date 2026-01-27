'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    hoverImage: string;
    badge?: 'New' | 'Sale' | 'Bestseller';
    rating: number;
    reviews: number;
}

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    // Initialize with some dummy data for demonstration
    const [wishlist, setWishlist] = useState<Product[]>([
        {
            id: '1',
            name: 'Kanjivaram Red Silk Saree',
            price: 25000,
            originalPrice: 32000,
            image: 'https://images.unsplash.com/photo-1610189012906-4783fda36324?auto=format&fit=crop&q=80&w=800',
            hoverImage: 'https://images.unsplash.com/photo-1610189004130-34463fe1c944?auto=format&fit=crop&q=80&w=800',
            badge: 'Bestseller',
            rating: 4.8,
            reviews: 124
        },
        {
            id: '3',
            name: 'Mysore Silk Gold Saree',
            price: 18000,
            originalPrice: 22000,
            image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
            hoverImage: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800',
            badge: 'New',
            rating: 4.9,
            reviews: 42
        }
    ]);

    const addToWishlist = (product: Product) => {
        setWishlist(prev => {
            if (prev.some(item => item.id === product.id)) return prev;
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist(prev => prev.filter(item => item.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount: wishlist.length
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
