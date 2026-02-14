"use client"

import { Button } from "@/components/ui/button"
import { Check, TicketPercent } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTaxSettings } from "@/hooks/use-tax-settings"

export function CartSummary() {
    const { items, totalItems, totalPrice, appliedCoupon, setCoupon, removeCoupon } = useCartStore();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();
    const { settings, loading } = useTaxSettings();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
    }, [appliedCoupon]);

    const count = isMounted ? totalItems() : 0;
    const subtotal = isMounted ? totalPrice() : 0;
    const discount = isMounted && appliedCoupon ? appliedCoupon.discount : 0;
    const total = subtotal - discount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }

        if (!session?.user?.id) {
            toast.error("Please login to apply coupon");
            router.push("/login?callbackUrl=/cart");
            return;
        }

        setIsApplyingCoupon(true);

        try {
            // Fetch product details to get categories
            const productIds = items.map(item => item.id);
            const productsResponse = await fetch('/api/products/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds })
            });

            const { products } = await productsResponse.json();

            // Map products to include categoryId
            const itemsWithCategory = items.map(item => {
                const product = products.find((p: any) => p.id === item.id);
                return {
                    productId: item.id,
                    categoryId: product?.categoryId || "",
                    price: item.price,
                    quantity: item.quantity
                };
            });

            const response = await fetch('/api/coupons/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode,
                    cart: {
                        userId: session.user.id,
                        subtotal: subtotal,
                        shippingCharges: 0,
                        items: itemsWithCategory
                    }
                })
            });

            const result = await response.json();



            if (result.success) {
                const couponData = {
                    code: result.couponCode,
                    discount: result.discount,
                    type: result.couponType
                };

                setCoupon(couponData);

                toast.success(`Coupon applied! You saved ₹${result.discount.toLocaleString('en-IN')}`);
            } else {

                toast.error(result.error || "Invalid coupon code");
            }
        } catch (error) {
            console.error('Failed to apply coupon:', error);
            toast.error("Failed to apply coupon");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        // Coupon is now persisted in Zustand store, no need for sessionStorage
        router.push("/checkout");
    };

    return (
        <div className="space-y-3 sticky top-32 animate-fade-in">
            {/* Apply Coupon - Enhanced */}
            <div className="bg-background border border-primary/20 p-4 rounded-sm shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <TicketPercent className="h-4 w-4 text-primary" />
                        <input
                            type="text"
                            placeholder="Apply Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon}
                            className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-text-muted disabled:opacity-50 text-primary font-medium tracking-wide"
                        />
                    </div>
                    {appliedCoupon ? (
                        <button
                            onClick={() => {
                                removeCoupon();
                                setCouponCode("");
                            }}
                            className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors uppercase tracking-wider"
                        >
                            Remove
                        </button>
                    ) : (
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponCode.trim()}
                            className="text-xs text-primary font-semibold hover:text-primary/70 transition-colors disabled:opacity-50 uppercase tracking-wider"
                        >
                            {isApplyingCoupon ? "Applying..." : "Apply"}
                        </button>
                    )}
                </div>
                {appliedCoupon && (
                    <div className="mt-3 p-2 text-xs text-green-700 font-medium flex items-center gap-2 bg-green-50 rounded-sm animate-scale-in border border-green-100">
                        <Check className="h-3 w-3" />
                        Coupon "{appliedCoupon.code}" applied successfully!
                    </div>
                )}
            </div>

            {/* Order Summary - Enhanced */}
            <div className="bg-surface/50 border border-primary/20 p-6 rounded-sm shadow-soft hover:shadow-luxury transition-all duration-300 backdrop-blur-sm">
                {/* Title */}
                <h3 className="text-sm font-semibold text-primary mb-5 pb-3 border-b border-primary/10 uppercase tracking-[0.2em]">Order Summary</h3>

                {/* Subtotal */}
                <div className="flex justify-between text-sm mb-4">
                    <span className="text-text-muted">Subtotal ({count} Item{count !== 1 ? 's' : ''})</span>
                    <span className="font-medium text-primary">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Tax Breakdown */}
                {loading ? (
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-xs text-text-muted mb-2">
                            <span>CGST ({settings.cgstRate}%)</span>
                            <span>₹{(subtotal * (settings.cgstRate / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-muted mb-4">
                            <span>SGST ({settings.sgstRate}%)</span>
                            <span>₹{(subtotal * (settings.sgstRate / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </>
                )}

                {/* Discount */}
                {appliedCoupon && (
                    <div className="flex justify-between text-sm mb-4 animate-fade-in">
                        <span className="text-green-700 flex items-center gap-2">
                            <Check className="h-3 w-3" />
                            Discount
                        </span>
                        <span className="font-medium text-green-700">-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                )}

                {/* Payable Amount */}
                <div className="flex justify-between text-base font-bold text-primary mb-6 pt-4 border-t border-primary/20">
                    <span className="font-serif">Total</span>
                    <span className="text-xl font-serif">
                        {loading ? (
                            <span className="h-6 w-20 bg-gray-100 rounded animate-pulse inline-block"></span>
                        ) : (
                            `₹${(subtotal + (subtotal * ((settings.cgstRate + settings.sgstRate) / 100)) - discount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        )}
                    </span>
                </div>

                {/* Terms Checkbox */}
                <div className="mb-6">
                    <div className="flex items-start gap-2 cursor-pointer select-none group" onClick={() => setTermsAccepted(!termsAccepted)}>
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={() => setTermsAccepted(!termsAccepted)}
                            className="mt-0.5 accent-primary cursor-pointer h-3 w-3 rounded-none border-primary/30"
                        />
                        <label className="text-[10px] text-text-muted cursor-pointer leading-relaxed uppercase tracking-wider group-hover:text-primary transition-colors select-none">
                            I Agree to Terms and Conditions
                        </label>
                    </div>
                </div>

                {/* Checkout Button */}
                <Button
                    onClick={handleCheckout}
                    disabled={!termsAccepted || count === 0}
                    className={cn(
                        "w-full bg-primary text-white hover:bg-primary/90 text-xs shadow-luxury rounded-sm uppercase tracking-[0.2em] h-12 transition-all duration-300",
                        (termsAccepted && count > 0)
                            ? "hover:shadow-elevated hover:scale-[1.01]"
                            : "opacity-50 cursor-not-allowed hover:bg-primary"
                    )}
                >
                    Proceed to Checkout
                </Button>

                {/* Savings Highlight */}
                {appliedCoupon && discount > 0 && (
                    <div className="mt-4 text-center text-xs text-primary/80 font-medium animate-fade-in-up font-serif italic">
                        You're saving ₹{discount.toLocaleString('en-IN')} on this order
                    </div>
                )}
            </div>
        </div>
    )

}
