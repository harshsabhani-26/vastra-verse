"use client"

import Image from "next/image"
import { Pencil, Trash2, Heart, ChevronDown } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { toast } from "react-hot-toast"

export function CartItem() {
    const { items, removeItem } = useCartStore();

    if (items.length === 0) {
        return <div className="py-8 text-stone-500">Your cart is empty.</div>;
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <div key={item.id + item.color} className="flex gap-6 py-6 border-b border-stone-100">
                    <div className="relative h-48 w-36 bg-stone-100 shrink-0">
                        <Image
                            src={item.image || "/images/placeholder.jpg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="flex-1 py-1 space-y-3">
                        <div className="flex justify-between items-start">
                            <h3 className="font-serif text-lg text-[#1C1917]">{item.name}</h3>
                        </div>

                        <p className="font-sans text-sm font-medium text-[#1C1917]">₹{item.price.toLocaleString('en-IN')}</p>

                        <div className="flex items-center gap-2 text-sm text-stone-600 font-sans">
                            <span>Qty: {item.quantity}</span>
                            <ChevronDown className="h-3 w-3" />
                        </div>

                        <div className="space-y-1 text-sm text-stone-600 font-sans">
                            {item.color && <p>Colour: {item.color}</p>}

                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <button className="text-stone-400 hover:text-stone-900 transition-colors">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    removeItem(item.id);
                                    toast.success("Item removed");
                                }}
                                className="text-stone-400 hover:text-stone-900 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-xs uppercase tracking-wider font-medium">
                                <Heart className="h-4 w-4" />
                                Save for Later
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ChevronDown component removed as it is imported from lucide-react now

