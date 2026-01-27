"use client";

import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/lib/store";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
    }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const addItem = useCartStore(state => state.addItem);

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        toast.success("Added to bag");
    };

    return (
        <Button
            size="lg"
            onClick={handleAddToCart}
            className="flex-1 h-12 uppercase tracking-widest bg-primary hover:bg-primary-light"
        >
            Add to Cart
        </Button>
    );
}
