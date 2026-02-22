import { getStories, getProducts } from "./actions";
import { StoriesManager } from "@/components/admin/StoriesManager";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
    const [stories, products] = await Promise.all([getStories(), getProducts()]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Trending Stories</h1>
                    <p className="text-stone-600 mt-1">
                        Manage video stories shown on the homepage (max 6 active)
                    </p>
                </div>
            </div>

            {/* Manager Component */}
            <StoriesManager initialStories={stories} products={products} />
        </div>
    );
}
