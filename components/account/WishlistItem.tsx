"use client";

import { Button } from "@/components/ui/button";
import { removeFromWishlist } from "@/app/actions/account";
import { useTransition } from "react";
import { toast } from "react-hot-toast";
import { Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    description: string;
    [key: string]: any;
}

export function WishlistItem({ product }: { product: Product }) {
    const [isPending, startTransition] = useTransition();
    const { addItem } = useCartStore();

    function handleRemove() {
        startTransition(async () => {
            const result = await removeFromWishlist(product.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Removed from wishlist");
            }
        });
    }

    function handleMoveToBag() {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0] || "/images/placeholder.jpg",
            quantity: 1,
            color: "Standard" // Default
        });
        toast.success("Moved to bag");
        handleRemove();
    }

    return (
        <div className="group flex flex-col md:flex-row gap-6 bg-background p-6 border border-primary/5 rounded-sm shadow-sm hover:shadow-luxury transition-all duration-300">
            <div className="relative w-full md:w-32 aspect-[3/4] bg-surface/50 border border-primary/5 flex-shrink-0 overflow-hidden">
                {product.images[0] && (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <h3 className="font-serif text-lg text-primary tracking-tight">{product.name}</h3>
                        <button
                            onClick={handleRemove}
                            disabled={isPending}
                            className="text-text-muted hover:text-red-500 transition-colors p-1"
                            aria-label="Remove from wishlist"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted uppercase tracking-wide">
                        <span>Classic Collection</span> {/* Placeholder for category? */}
                    </div>
                </div>

                <div className="mt-4 md:mt-0 space-y-4">
                    <div>
                        <p className="font-medium text-lg text-primary">₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Inclusive of all taxes</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            onClick={handleMoveToBag}
                            className="bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] h-10 rounded-sm font-bold shadow-luxury hover:shadow-elevated transition-all flex items-center justify-center gap-2 px-6"
                        >
                            <ShoppingBag className="w-3 h-3" />
                            Move to Bag
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
