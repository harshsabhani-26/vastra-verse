"use client";

import { useCartStore } from "@/lib/store";
import { X, Trash2, Heart, ChevronDown } from "lucide-react"; // Changed Trash to Trash2, added ChevronDown
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, addItem, totalPrice, totalItems } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={closeCart}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#FAF9F6] z-[70] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between bg-white border-b border-stone-100">
                    <h2 className="text-lg font-serif text-[#1C1917] tracking-wide">
                        Your shopping bag ({totalItems()} Items)
                    </h2>
                    <button onClick={closeCart} className="p-1 hover:bg-stone-50 rounded-full transition-colors">
                        <X className="h-5 w-5 text-stone-400 font-light" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                            <p className="text-stone-500 font-serif text-lg">Your bag is empty.</p>
                            <Button
                                onClick={closeCart}
                                variant="outline"
                                className="border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white rounded-none uppercase tracking-widest text-xs px-8 py-6"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-6 flex gap-5 bg-white">
                                    {/* Image */}
                                    <div className="relative h-40 w-28 flex-shrink-0 bg-stone-50">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-serif text-[#1C1917] text-base leading-snug max-w-[200px] mb-1">
                                                    {item.name}
                                                </h3>
                                                <div className="space-y-1 mt-2">
                                                    <p className="text-xs text-stone-500 font-light tracking-wide">
                                                        Colour: <span className="text-stone-800">{item.color || 'Ivory'}</span>
                                                    </p>

                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-end justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Qty Dropdown (Visual) */}
                                                <div className="relative group cursor-pointer">
                                                    <div className="flex items-center gap-1 text-xs text-stone-800 border-b border-transparent hover:border-stone-300 pb-0.5">
                                                        <span>Qty: {item.quantity}</span>
                                                        <ChevronDown className="h-3 w-3 text-stone-400" />
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 ml-2">
                                                    <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-red-800 transition-colors">
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                                    </button>
                                                    <button className="text-stone-400 hover:text-stone-800 transition-colors">
                                                        <Heart className="h-4 w-4" strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-medium text-[#1C1917]">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="bg-[#FAF9F6] p-6 space-y-4 border-t border-stone-100">
                        <div className="flex justify-between items-center text-[#1C1917]">
                            <span className="font-medium text-sm">Total</span>
                            <span className="font-serif text-lg font-medium">₹{totalPrice().toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 font-light tracking-wide">
                            Shipping and taxes calculated at checkout.
                        </p>

                        <div className="pt-4 space-y-3">
                            <Link href="/cart" onClick={closeCart} className="block w-full">
                                <Button className="w-full bg-[#1C1917] hover:bg-[#333333] text-white h-12 rounded-none uppercase tracking-[0.2em] text-xs font-medium">
                                    View Shopping Cart
                                </Button>
                            </Link>

                            <div className="text-center">
                                <Link
                                    href="/checkout"
                                    onClick={closeCart}
                                    className="inline-block border-b border-stone-800 pb-0.5 text-xs uppercase tracking-widest text-[#1C1917] hover:text-stone-600 hover:border-stone-400 transition-colors"
                                >
                                    Checkout
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
