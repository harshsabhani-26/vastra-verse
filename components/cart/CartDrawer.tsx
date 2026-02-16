"use client";

import { useCartStore } from "@/lib/store";
import { X, ShoppingBag, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync cart prices with database when cart opens (optional, adhering to previous logic if needed, but keeping it simple for UI focus first)
    // If needed specifically, we can re-add the sync logic. For now, ensuring UI works.

    if (!mounted) return null;

    const handleCheckout = () => {
        closeCart();
        if (!session?.user) {
            toast.error("Please login to proceed to checkout");
            router.push("/login?callbackUrl=/checkout");
            return;
        }
        router.push("/checkout");
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent className="w-full sm:max-w-md bg-background p-0 border-l border-primary/10 shadow-2xl">
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-primary/10 bg-surface/50 backdrop-blur-sm">
                        <h2 className="text-xl font-serif text-primary tracking-tight">Shopping Bag ({items.length})</h2>
                        <button
                            onClick={closeCart}
                            className="p-2 -mr-2 text-primary hover:text-red-500 transition-colors rounded-full hover:bg-primary/5"
                            aria-label="Close cart"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                                <ShoppingBag className="h-12 w-12 text-primary/20" strokeWidth={1} />
                                <p className="text-text-muted text-lg font-light">Your bag is empty</p>
                                <Button
                                    onClick={closeCart}
                                    variant="link"
                                    className="text-primary hover:text-primary-dark uppercase tracking-widest text-xs font-medium underline-offset-4"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-4 animate-fade-in">
                                    <div className="relative w-24 h-32 bg-secondary/5 flex-shrink-0 border border-primary/5 cursor-pointer overflow-hidden group">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-serif text-primary text-base leading-tight line-clamp-2 hover:text-secondary transition-colors cursor-pointer">
                                                    {item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-text-muted hover:text-red-500 transition-colors p-1"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-primary mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wide">Size: XS</p>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wide">Color: Ivory</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-primary/20 rounded-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                                    className="p-1 hover:bg-primary/5 text-primary transition-colors"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-medium text-primary">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-primary/5 text-primary transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="p-6 border-t border-primary/10 bg-surface/50 backdrop-blur-sm space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-base font-medium text-primary">
                                    <span>Subtotal</span>
                                    <span>₹{totalPrice().toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-[10px] text-text-muted text-center uppercase tracking-wide">
                                    Shipping & taxes calculated at checkout
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => {
                                        closeCart();
                                        router.push("/cart");
                                    }}
                                    variant="outline"
                                    className="h-12 border-primary text-primary hover:bg-primary hover:text-white rounded-sm uppercase tracking-widest text-[10px] font-bold transition-all duration-300"
                                >
                                    View Bag
                                </Button>
                                <Button
                                    onClick={handleCheckout}
                                    className="h-12 bg-primary hover:bg-primary-dark text-white rounded-sm uppercase tracking-widest text-[10px] font-bold shadow-luxury hover:shadow-elevated transition-all duration-300"
                                >
                                    Checkout
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
