"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { toast } from "react-hot-toast";

interface AddToCartProps {
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
    }
}


const COLORS = [
    { name: "Royal Blue", class: "bg-blue-800" },
    { name: "Deep Red", class: "bg-red-800" },
    { name: "Emerald", class: "bg-emerald-800" }
];

export function AddToCartSection({ product }: AddToCartProps) {
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { addItem, openCart } = useCartStore();

    const handleAddToCart = () => {
        if (!selectedColor) {
            toast.error("Please select a color");
            return;
        }

        setLoading(true);
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            color: selectedColor
        });
        setLoading(false);
        toast.success("Added to Bag!");
        openCart();
    };

    return (
        <div className="space-y-6 pt-6 border-t border-stone-200">
            {/* Color Selection */}
            <div>
                <label className="text-sm font-medium text-stone-900 block mb-3">Color: <span className="text-stone-500 font-normal">{selectedColor}</span></label>
                <div className="flex gap-3">
                    {COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedColor(color.name)}
                            className={`h-8 w-8 rounded-full ${color.class} ring-offset-2 transition-all ${selectedColor === color.name ? 'ring-2 ring-stone-900 scale-110' : 'hover:scale-110'}`}
                            aria-label={color.name}
                        />
                    ))}
                </div>
            </div>



            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <Button
                    className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white uppercase tracking-wider"
                    onClick={handleAddToCart}
                    disabled={loading}
                >
                    {loading ? "Adding..." : (
                        <>
                            <ShoppingBag className="mr-2 h-4 w-4" /> Add to Bag
                        </>
                    )}
                </Button>
                <Button variant="outline" className="h-12 w-12 p-0 border-stone-300">
                    <Heart className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
