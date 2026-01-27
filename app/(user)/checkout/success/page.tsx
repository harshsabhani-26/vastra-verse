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
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <CheckCircle className="h-24 w-24 text-green-600" />
                </div>
                <h1 className="text-4xl font-serif text-[#1C1917]">Order Confirmed!</h1>
                <p className="text-stone-600 text-lg">
                    Thank you for your purchase. Your order has been placed successfully and is being processed.
                </p>
                <div className="pt-8">
                    <Link href="/shop">
                        <Button className="bg-[#1C1917] hover:bg-[#333333] min-w-[200px]">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
