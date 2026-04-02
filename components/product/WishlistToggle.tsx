"use client";

import { Heart } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toggleWishlist } from "@/app/actions/account";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useSession } from "next-auth/react";

interface WishlistToggleProps {
    productId: string;
    initialIsWishlisted?: boolean;
    className?: string;
}

export function WishlistToggle({ productId, initialIsWishlisted = false, className }: WishlistToggleProps) {
    const { isInWishlist, addItem, removeItem } = useWishlistStore();
    const { status } = useSession();
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isWishlisted = mounted ? isInWishlist(productId) : initialIsWishlisted;

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // If not logged in, show a login prompt instead of toggling
        if (status !== "authenticated") {
            toast.error("Please log in to save items to your wishlist");
            return;
        }

        const newState = !isWishlisted;

        // Optimistic update
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
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "p-2 rounded-full transition-all duration-300 z-20",
                isWishlisted
                    ? "bg-white text-red-500 shadow-sm opacity-100"
                    // Always visible on mobile (touch devices need permanent visibility)
                    // On desktop: invisible until group-hover
                    : "bg-white/80 text-stone-500 opacity-100 md:opacity-0 md:bg-white/0 md:group-hover:opacity-100 md:group-hover:bg-white/80",
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
