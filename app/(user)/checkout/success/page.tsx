"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/store";

export default function CheckoutSuccessPage() {
    const clearCart = useCartStore((state) => state.clearCart);

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-8 max-w-lg bg-surface/30 p-10 rounded-sm border border-primary/5 shadow-soft animate-fade-in-up">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-50 p-4 shadow-sm">
                        <CheckCircle className="h-20 w-20 text-green-700" strokeWidth={1.5} />
                    </div>
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-serif text-primary tracking-tight">Order Confirmed!</h1>
                    <p className="text-text-muted text-lg font-light leading-relaxed">
                        Thank you for your purchase. Your order has been placed successfully and is being processed.
                    </p>
                </div>
                <div className="pt-6">
                    <Link href="/shop">
                        <Button className="bg-primary hover:bg-primary-dark min-w-[220px] h-12 rounded-sm uppercase tracking-[0.2em] text-xs font-medium shadow-luxury hover:shadow-elevated transition-all duration-300">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
