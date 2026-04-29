"use client";

import { useCartStore } from "@/lib/store";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
    productId: string;
    productName: string;
    productPrice: number;
    productImage: string;
}

export function AddToCartButton({ productId, productName, productPrice, productImage }: AddToCartButtonProps) {
    const { addItem, closeCart, openCart, items } = useCartStore();
    const router = useRouter();

    const isInCart = items.some((item) => item.id === productId);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isInCart) {
            router.push('/cart');
            return;
        }

        addItem({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1,
        }).catch((error: any) => {
            toast.error(error?.message || "Failed to add to cart");
        });

        closeCart(); // prevent cart drawer from opening
        toast.success("Added to cart!");
    };

    return (
        <button
            onClick={handleAddToCart}
            className={`w-full font-sans text-[14px] font-medium py-[10px] px-[16px] border transition-colors duration-200 ${isInCart
                ? "bg-[#172026] text-white border-[#172026] hover:bg-[#42120f] hover:border-[#42120f]"
                : "bg-white text-[#172026] border-[#e0e0e0] hover:bg-[#172026] hover:text-white"
                }`}
        >
            {isInCart ? "Go to Cart " : "Add to Cart"}
        </button>
    );
}
