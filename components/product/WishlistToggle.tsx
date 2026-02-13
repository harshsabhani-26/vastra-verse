"use client";

import { Heart } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toggleWishlist } from "@/app/actions/account";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useWishlistStore } from "@/lib/wishlist-store";

interface WishlistToggleProps {
    productId: string;
    initialIsWishlisted?: boolean;
    className?: string; // Allow custom positioning if needed
}

export function WishlistToggle({ productId, initialIsWishlisted = false, className }: WishlistToggleProps) {
    const { isInWishlist, addItem, removeItem } = useWishlistStore();
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isWishlisted = mounted ? isInWishlist(productId) : initialIsWishlisted;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation(); // Stop bubbling

        // Optimistic update
        const newState = !isWishlisted;

        if (newState) {
            addItem(productId);
            toast.success("Added to wishlist");
        } else {
            removeItem(productId);
            toast.success("Removed from wishlist");
        }

        startTransition(async () => {
            const result = await toggleWishlist(productId);
            if (result.error) {
                // Revert on error
                if (newState) {
                    removeItem(productId);
                } else {
                    addItem(productId);
                }
                toast.error(result.error);
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "p-2 rounded-full transition-all duration-300 z-20", // high z-index
                isWishlisted
                    ? "bg-white text-red-500 shadow-sm opacity-100"
                    : "bg-white/0 text-stone-600 hover:bg-white/80 opacity-0 group-hover:opacity-100",
                className
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={cn("h-5 w-5 transition-transform", isWishlisted && "fill-current scale-110")}
            />
        </button>
    );
}
