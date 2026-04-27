"use client"

import Image from "next/image"
import { Pencil, Trash2, Heart } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { toast } from "react-hot-toast"
import { useState, useEffect } from "react"

export function CartItem() {
    const { items, removeItem, updateQuantity } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="py-8 text-stone-500">Loading...</div>;
    }

    if (items.length === 0) {
        return <div className="py-8 text-stone-500">Your cart is empty.</div>;
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <div key={item.id + item.color} className="flex gap-6 pb-6 border-b border-primary/10 last:border-b-0">
                    {/* Product Image - Bigger */}
                    <div className="relative h-40 w-32 bg-secondary/5 shrink-0 shadow-sm">
                        <Image
                            src={item.image || "/images/placeholder.jpg"}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 120px, 150px"
                            className="object-cover"
                        />
                    </div>

                    {/* Product Details - Compact Horizontal */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                        {/* Product Info */}
                        <div>
                            {/* Product Name - comes FIRST */}
                            <h3 className="font-serif text-lg text-primary mb-1 leading-tight">{item.name}</h3>

                            {/* Price - comes SECOND */}
                            <p className="text-sm font-medium text-primary mb-3">₹{item.price.toLocaleString('en-IN')}</p>

                            {/* Quantity, Color, Size in compact layout */}
                            <div className="space-y-1.5 text-xs text-text-muted">
                                <div className="flex items-center gap-2">
                                    <span className="uppercase tracking-widest">Qty:</span>
                                    <select
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                        className="border border-primary/20 rounded-sm px-2 py-0.5 text-xs bg-background focus:outline-none focus:border-primary text-primary font-medium"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <option
                                                key={num}
                                                value={num}
                                                disabled={item.stock !== undefined && num > item.stock}
                                            >
                                                {num} {item.stock !== undefined && num > item.stock ? '(Out of Stock)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {item.stock !== undefined && item.quantity >= item.stock && (
                                        <span className="text-[10px] text-red-500 font-medium">Max Limit</span>
                                    )}
                                </div>
                                {item.color && (
                                    <div>
                                        <span className="uppercase tracking-widest">Colour: </span>
                                        <span className="text-primary">{item.color}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="uppercase tracking-widest">Size: </span>
                                    <span className="text-primary">XS</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Icons - Smaller and minimal */}
                        <div className="flex items-center gap-5 mt-4">
                            <button
                                className="text-text-muted hover:text-primary transition-colors duration-300"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    removeItem(item.id);
                                    toast.success("Item removed");
                                }}
                                className="text-text-muted hover:text-red-700 transition-colors duration-300"
                                title="Remove"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors text-xs uppercase tracking-widest group">
                                <Heart className="h-3.5 w-3.5 group-hover:fill-primary" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
