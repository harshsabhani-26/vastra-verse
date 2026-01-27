"use client"

import { Button } from "@/components/ui/button"
import { Check, TicketPercent } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function CartSummary() {
    const { items, totalItems, totalPrice } = useCartStore();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();
    const count = totalItems();
    const total = totalPrice();

    const handleCheckout = async () => {
        // Since we are client-side here and createOrder is a server action
        // We can create a FormData to match the action signature or (better)
        // just call a modified action that accepts our data.
        // For this audit, we'll assume the action is set up for form submission
        // or we'll wrap it in a form.

        // Simulating form submission for now as action expects FormData
        // In a real app, verify user session or handle guest checkout
    }

    return (
        <div className="bg-[#FAF9F6] p-8 space-y-8 sticky top-32">
            {/* Coupon */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
                <TicketPercent className="h-5 w-5 text-stone-400" />
                <input
                    type="text"
                    placeholder="Apply Coupon"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#1C1917] font-medium"
                />
                <button className="text-xs uppercase tracking-widest text-[#AA8C2C] font-semibold hover:text-[#886e20]">
                    Apply
                </button>
            </div>

            {/* Order Summary */}
            <div className="bg-stone-100 p-6 space-y-4">
                <h3 className="font-serif text-sm text-[#1C1917] mb-4">Order Summary</h3>

                <div className="flex justify-between text-sm text-stone-600 font-sans border-b border-stone-200 pb-4">
                    <span>Subtotal ({count} Item{count !== 1 ? 's' : ''})</span>
                    <span className="font-medium text-[#1C1917]">₹{total.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-[#1C1917] font-sans">
                    <span>Payable Amount</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setTermsAccepted(!termsAccepted)}>
                    <div
                        className={cn(
                            "w-5 h-5 border flex items-center justify-center transition-colors flex-shrink-0",
                            termsAccepted ? "bg-[#9A8453] border-[#9A8453]" : "border-stone-400 bg-transparent"
                        )}
                    >
                        {termsAccepted && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 cursor-pointer">
                        I Agree to Terms and Conditions
                    </label>
                </div>

                <Button
                    onClick={() => {
                        if (termsAccepted) {
                            router.push("/checkout");
                        }
                    }}
                    disabled={!termsAccepted || count === 0}
                    className={cn(
                        "w-full h-12 rounded-none uppercase tracking-widest text-xs font-medium transition-all duration-300",
                        (termsAccepted && count > 0)
                            ? "bg-[#1C1917] hover:bg-[#333333] text-white"
                            : "bg-[#9F9F9F] text-white hover:bg-[#9F9F9F] opacity-100 cursor-not-allowed"
                    )}
                >
                    Checkout
                </Button>
            </div>
        </div>
    )
}
