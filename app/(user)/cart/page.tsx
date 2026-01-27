import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            <div className="container mx-auto px-4 md:px-12 py-12">
                <h1 className="text-4xl font-serif text-[#1C1917] mb-8 pb-4 border-b border-stone-200">Your Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <CartItem />
                        {/* Add more items if needed for visualization */}
                    </div>

                    {/* Cart Summary */}
                    <div className="lg:col-span-1">
                        <CartSummary />
                    </div>
                </div>
            </div>
        </div>
    );
}
