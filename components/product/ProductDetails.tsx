"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { toast } from "react-hot-toast";
import { Heart, Share2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Color mapping (reused from ColorFilter)
const COLOR_MAP: Record<string, string> = {
    "Beige": "bg-[#F5F5DC]",
    "Black": "bg-black",
    "Blue": "bg-blue-600",
    "Brown": "bg-[#8B4513]",
    "Green": "bg-green-600",
    "Orange": "bg-orange-500",
    "Pink": "bg-pink-400",
    "Red": "bg-red-600",
    "White": "bg-white border border-stone-200",
    "Yellow": "bg-yellow-400",
    "Maroon": "bg-[#800000]",
    "Gold": "bg-[#FFD700]",
    "Cream": "bg-[#FFFDD0]",
    "Navy": "bg-[#000080]",
    "Silver": "bg-[#C0C0C0]",
    "Purple": "bg-purple-600"
};



interface ProductDetailsProps {
    product: any; // Using any for flexibility with Prisma includes, ideally define strict type
    initialIsWishlisted?: boolean;
}

export function ProductDetails({ product, initialIsWishlisted = false }: ProductDetailsProps) {
    const { addItem, openCart, items } = useCartStore();

    // State
    const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || "");
    const [loading, setLoading] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [deliveryMethod, setDeliveryMethod] = useState<"home" | "store">("home");
    const [stock, setStock] = useState<number | null>(null);

    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>("details");

    useEffect(() => {
        const fetchStock = async () => {
            try {
                // Dynamic import to avoid server-side issues if any, though explicit import is fine for server actions
                const { getRealTimeStock } = await import("@/actions/stock");
                const currentStock = await getRealTimeStock(product.id);
                setStock(currentStock);
            } catch (error) {
                console.error("Failed to fetch stock", error);
                setStock(product.stock); // Fallback to prop
            }
        };
        fetchStock();
    }, [product.id, product.stock]);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    // Calculate availability
    const cartItem = items.find(item => item.id === product.id);
    const cartQuantity = cartItem?.quantity || 0;
    const currentStock = stock !== null ? stock : product.stock; // Prefer real-time
    const availableToAdd = Math.max(0, currentStock - cartQuantity);
    const isOutOfStock = currentStock <= 0;
    const isLimitReached = availableToAdd <= 0;

    const handleAddToCart = () => {
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        if (isLimitReached) {
            toast.error(`Only ${currentStock} units available (you have ${cartQuantity} in cart)`);
            return;
        }

        setLoading(true);
        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.finalPrice || product.price),
            image: product.images?.[0]?.url || "/images/placeholder.jpg",
            quantity: 1,
            color: selectedColor || "Default"
        });
        setLoading(false);
        toast.success("Added to Bag!");
        openCart();
    };

    const toggleWishlist = async () => {
        // Optimistic UI update
        setIsWishlisted(!isWishlisted);
        try {
            await fetch(`/api/wishlist/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id })
            });
        } catch (error) {
            setIsWishlisted(!isWishlisted); // Revert on error
            toast.error("Failed to update wishlist");
        }
    };



    return (
        <div className="space-y-8 sticky top-24">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary mb-2">
                            {product.category?.name || "Collection"}
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-serif text-primary leading-tight">
                            {product.name}
                        </h1>
                    </div>
                </div>

                <div>
                    <p className="text-2xl font-serif text-primary">
                        ₹{Number(product.finalPrice || product.price).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wide">
                        MRP Inclusive of all taxes
                    </p>

                    {/* Stock Status */}
                    {stock !== null && (
                        <div className={cn(
                            "mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                            stock > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                        )}>
                            {stock > 0 ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Available PCS: {stock}
                                </span>
                            ) : (
                                "Out of Stock"
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="prose prose-stone text-sm text-text-main leading-relaxed font-sans">
                <p>{product.description}</p>
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-primary">Colour: <span className="font-medium">{selectedColor}</span></span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {product.colors.map((color: string) => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "w-8 h-8 rounded-full border relative transition-all",
                                    selectedColor === color ? "ring-1 ring-offset-2 ring-primary scale-110" : "hover:scale-110 border-primary/20",
                                    COLOR_MAP[color] || "bg-stone-200"
                                )}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}



            {/* Delivery Method */}
            <div className="space-y-3 pt-2">
                <span className="text-sm text-primary">Delivery Method:</span>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", deliveryMethod === 'home' ? "border-primary" : "border-primary/20")}>
                            {deliveryMethod === 'home' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <input type="radio" className="hidden" checked={deliveryMethod === 'home'} onChange={() => setDeliveryMethod('home')} />
                        <span className="text-sm text-text-main">Home Delivery</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", deliveryMethod === 'store' ? "border-primary" : "border-primary/20")}>
                            {deliveryMethod === 'store' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <input type="radio" className="hidden" checked={deliveryMethod === 'store'} onChange={() => setDeliveryMethod('store')} />
                        <span className="text-sm text-text-main">Store Pick-up</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <Button
                    onClick={handleAddToCart}
                    disabled={loading || isOutOfStock || isLimitReached}
                    className={cn(
                        "flex-1 h-12 uppercase tracking-[0.2em] text-xs font-medium rounded-sm transition-all duration-300 shadow-luxury",
                        (isOutOfStock || isLimitReached)
                            ? "bg-primary/5 text-text-muted cursor-not-allowed"
                            : "bg-primary hover:bg-primary/90 text-white hover:shadow-elevated"
                    )}
                >
                    {loading ? "Adding..." : (isOutOfStock ? "Out of Stock" : (isLimitReached ? "Limit Reached" : "Add To Cart"))}
                </Button>
                <button
                    onClick={toggleWishlist}
                    className="h-12 w-12 flex items-center justify-center border border-primary/20 hover:border-primary transition-colors text-primary"
                >
                    <Heart className={cn("w-5 h-5", isWishlisted ? "fill-primary text-primary" : "text-primary")} />
                </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
                This is a made to order style and we will take 7-10 business days for production and dispatch orders within India and internationally.
            </p>

            {/* Accordions */}
            <div className="border-t border-primary/10 mt-8">
                <AccordionItem
                    title="Product Details"
                    isOpen={openSection === 'details'}
                    onClick={() => toggleSection('details')}
                >
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-text-muted">
                        {product.fabricType && (
                            <>
                                <span className="font-medium text-primary">Fabric:</span>
                                <span>{product.fabricType}</span>
                            </>
                        )}
                        {product.weaveType && (
                            <>
                                <span className="font-medium text-primary">Weave:</span>
                                <span>{product.weaveType}</span>
                            </>
                        )}
                        {product.sareeLength && (
                            <>
                                <span className="font-medium text-primary">Saree Length:</span>
                                <span>{product.sareeLength}</span>
                            </>
                        )}
                        {product.blouseLength && (
                            <>
                                <span className="font-medium text-primary">Blouse Length:</span>
                                <span>{product.blouseLength}</span>
                            </>
                        )}
                        <span className="font-medium text-primary">SKU:</span>
                        <span>{product.sku || product.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </AccordionItem>

                <AccordionItem
                    title="Contact Our Stylist"
                    isOpen={openSection === 'stylist'}
                    onClick={() => toggleSection('stylist')}
                >
                    <p className="text-sm text-text-muted">
                        Need help with styling or customization? Contact our styling team at <a href="mailto:stylist@example.com" className="underline hover:text-primary">stylist@example.com</a> or call us at +91 91234 56789.
                    </p>
                </AccordionItem>

                <AccordionItem
                    title="Delivery & Returns"
                    isOpen={openSection === 'delivery'}
                    onClick={() => toggleSection('delivery')}
                >
                    <p className="text-sm text-text-muted">
                        We offer free shipping on all orders above ₹5,000 within India. International shipping is calculated at checkout. Returns are only accepted for wrong or defective products delivered within 7 days of receipt.
                    </p>
                </AccordionItem>

                <AccordionItem
                    title="Disclaimer"
                    isOpen={openSection === 'disclaimer'}
                    onClick={() => toggleSection('disclaimer')}
                >
                    <p className="text-sm text-text-muted">
                        The colors you see on your screen may slightly vary from the actual product due to different screen calibrations. Handwoven fabrics may have slight irregularities which are natural.
                    </p>
                </AccordionItem>
            </div>
        </div>
    );
}

function AccordionItem({ title, isOpen, onClick, children }: { title: string, isOpen: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <div className="border-b border-primary/10">
            <button
                onClick={onClick}
                className="w-full py-4 flex items-center justify-between text-left group"
            >
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary group-hover:text-secondary transition-colors">
                    {title}
                </span>
                {isOpen ? <Minus className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            </button>
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
                )}
            >
                {children}
            </div>
        </div>
    );
}
