import Link from "next/link";
import { Plus } from "lucide-react";
import { getBanners } from "./actions";
import { BannersList } from "@/components/admin/BannersList";

export default async function BannersPage() {
    const banners = await getBanners();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Hero Banners</h1>
                    <p className="text-stone-600 mt-1">Manage homepage hero slider banners</p>
                </div>
                <Link href="/admin/banners/new">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-white rounded hover:bg-stone-800 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Banner
                    </button>
                </Link>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-lg border border-stone-200">
                {banners.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-stone-500 mb-4">No banners yet. Create your first banner to get started.</p>
                        <Link href="/admin/banners/new">
                            <button className="px-6 py-2 border border-stone-300 rounded hover:bg-stone-50 transition-colors">
                                Create First Banner
                            </button>
                        </Link>
                    </div>
                ) : (
                    <BannersList initialBanners={banners} />
                )}
            </div>
        </div>
    );
}
