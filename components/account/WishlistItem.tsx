"use client";

import { Button } from "@/components/ui/button";
import { removeFromWishlist } from "@/app/actions/account";
import { useTransition } from "react";
import { toast } from "react-hot-toast";
import { Trash2, Edit2, Share2 } from "lucide-react";
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
        <div className="flex flex-col md:flex-row gap-6 bg-white p-6 border border-stone-100">
            <div className="relative w-full md:w-32 aspect-[3/4] bg-stone-100 flex-shrink-0">
                {product.images[0] && (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <h3 className="font-serif text-lg text-primary">{product.name}</h3>
                </div>

                <p className="text-sm text-stone-600">Colour: White</p> {/* Static for now as schema doesn't have variants */}
                <div className="flex items-center gap-4 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                        <span>Qty 1</span>
                    </div>
                </div>

                <p className="font-medium text-lg pt-2">₹{parseFloat(product.price.toString()).toLocaleString()}</p>
                <p className="text-xs text-stone-500">MRP Inclusive of all taxes</p>

                <div className="flex gap-4 pt-2">
                    <button className="text-stone-400 hover:text-primary transition-colors">
                        <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleRemove}
                        disabled={isPending}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 md:self-end w-full md:w-auto mt-4 md:mt-0">
                <Button
                    onClick={handleMoveToBag}
                    className="w-full md:w-[200px] bg-white border border-stone-300 text-primary hover:bg-stone-50 uppercase tracking-widest text-xs h-12 rounded-none"
                >
                    Move to Bag
                </Button>
            </div>
        </div>
    );
}
