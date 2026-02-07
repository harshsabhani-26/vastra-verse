"use client"

import { useEffect } from "react";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCartStore } from "@/lib/store";

export default function CartPage() {
    const { items, removeInvalidItems } = useCartStore();

    useEffect(() => {
        // Validate cart items against current products in database
        async function validateCartItems() {
            if (items.length === 0) return;

            try {
                // Fetch product ids that exist in cart
                const cartProductIds = items.map(item => item.id);

                // Call API to check which products still exist
                const response = await fetch('/api/products/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productIds: cartProductIds })
                });

                if (response.ok) {
                    const { validIds }: { validIds: string[] } = await response.json();
                    const validIdSet = new Set(validIds);

                    // Remove products that no longer exist
                    removeInvalidItems(validIdSet);
                }
            } catch (error) {
                console.error('Failed to validate cart items:', error);
            }
        }

        validateCartItems();
    }, []); // Run once on mount

    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl pb-16 overflow-x-hidden">
                {/* Page Title */}
                <h1 className="text-2xl font-serif text-primary mb-8 pb-6 border-b border-primary/10">Your Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Cart Items - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <CartItem />
                    </div>

                    {/* Cart Summary - Takes 1 column, shifted towards center */}
                    <div className="lg:col-span-1">
                        <div className="lg:ml-8">
                            <CartSummary />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
