import { Button } from "@/components/ui/button";

export function FilterSidebar() {
    return (
        <div className="hidden lg:block w-64 space-y-8 pr-8 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto">
            <div>
                <h3 className="text-lg font-serif mb-4">Categories</h3>
                <ul className="space-y-2 text-sm text-stone-600">
                    <li className="cursor-pointer hover:text-primary transition-colors font-medium text-primary">All</li>
                    <li className="cursor-pointer hover:text-primary transition-colors">Sarees</li>
                    <li className="cursor-pointer hover:text-primary transition-colors">Lehengas</li>
                    <li className="cursor-pointer hover:text-primary transition-colors">Kurtas</li>
                    <li className="cursor-pointer hover:text-primary transition-colors">Accessories</li>
                </ul>
            </div>

            <div>
                <h3 className="text-lg font-serif mb-4">Color</h3>
                <div className="grid grid-cols-4 gap-2">
                    {['bg-red-700', 'bg-green-800', 'bg-blue-900', 'bg-yellow-500', 'bg-black', 'bg-white border', 'bg-pink-600', 'bg-purple-800'].map((color, i) => (
                        <div key={i} className={`h-8 w-8 rounded-full cursor-pointer ${color} hover:ring-2 ring-offset-2 ring-stone-300`} />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-serif mb-4">Price</h3>
                <div className="space-y-2 text-sm text-stone-600">
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-stone-300 text-primary focus:ring-primary" />
                        <span>Under ₹10,000</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-stone-300 text-primary focus:ring-primary" />
                        <span>₹10,000 - ₹25,000</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-stone-300 text-primary focus:ring-primary" />
                        <span>₹25,000 - ₹50,000</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-stone-300 text-primary focus:ring-primary" />
                        <span>Above ₹50,000</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
