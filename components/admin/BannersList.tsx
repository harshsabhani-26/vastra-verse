"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteBanner, toggleBannerStatus, type HeroBanner } from "@/app/admin/banners/actions";
import { Pencil, Trash2, Eye, EyeOff, Monitor, Smartphone, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface BannersListProps {
    initialBanners: HeroBanner[];
}

type DisplayTab = "BOTH" | "WEB" | "MOBILE";

export function BannersList({ initialBanners }: BannersListProps) {
    const router = useRouter();
    const [banners, setBanners] = useState(initialBanners);
    const [activeTab, setActiveTab] = useState<DisplayTab>("WEB");

    const filteredBanners = banners.filter((banner) => {
        const display = (banner as any).displayFor;
        if (activeTab === "WEB") return display === "WEB" || display === "BOTH";
        if (activeTab === "MOBILE") return display === "MOBILE" || display === "BOTH";
        return true;
    });

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleBannerStatus(id, !currentStatus);
        if (result.success) {
            setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
            toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
        } else {
            toast.error("Failed to update banner status");
        }
    };

    const handleDelete = async (id: string, ctaLink: string) => {
        if (!confirm(`Are you sure you want to delete banner with link "${ctaLink}"?`)) return;

        const result = await deleteBanner(id);
        if (result.success) {
            setBanners(prev => prev.filter(b => b.id !== id));
            toast.success("Banner deleted successfully");
        } else {
            toast.error("Failed to delete banner");
        }
    };

    const tabs: { key: DisplayTab; label: string; icon: React.ReactNode }[] = [
        { key: "WEB", label: "Web / Desktop", icon: <Monitor size={16} /> },
        { key: "MOBILE", label: "Mobile", icon: <Smartphone size={16} /> },
    ];

    return (
        <div>
            {/* Tabs */}
            <div className="flex border-b border-stone-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === tab.key
                                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                            }`}>
                            {tab.key === "BOTH"
                                ? banners.length
                                : banners.filter(b => (b as any).displayFor === tab.key).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            {filteredBanners.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-stone-500">No banners for this display target yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium text-stone-700">Preview</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-700">Type</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-700">Display</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-700">Link</th>
                                <th className="text-left p-3 text-sm font-medium text-stone-700">Order</th>
                                <th className="text-center p-3 text-sm font-medium text-stone-700">Status</th>
                                <th className="text-right p-3 text-sm font-medium text-stone-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBanners.map((banner) => (
                                <tr key={banner.id} className="border-b border-stone-200 hover:bg-stone-50">
                                    <td className="p-3">
                                        {banner.mediaType === 'VIDEO' && banner.videoUrl ? (
                                            <video
                                                src={banner.videoUrl}
                                                className="w-16 h-10 object-cover rounded"
                                                muted
                                            />
                                        ) : banner.imageUrl ? (
                                            <Image
                                                src={banner.imageUrl}
                                                alt={banner.ctaLink}
                                                width={64}
                                                height={40}
                                                className="w-16 h-10 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-16 h-10 bg-stone-200 rounded flex items-center justify-center text-xs text-stone-500">
                                                No media
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${banner.bannerType === 'HERO'
                                                ? 'bg-blue-100 text-blue-700'
                                                : banner.bannerType === 'MID_PAGE'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                            {banner.bannerType === 'HERO' ? 'Hero' : banner.bannerType === 'MID_PAGE' ? 'Mid-Page' : 'Bottom'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${(banner as any).displayFor === 'MOBILE'
                                                ? 'bg-amber-100 text-amber-700'
                                                : (banner as any).displayFor === 'WEB'
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-stone-100 text-stone-600'
                                            }`}>
                                            {(banner as any).displayFor === 'MOBILE' ? '📱 Mobile' : (banner as any).displayFor === 'WEB' ? '🖥️ Web' : '🌐 Both'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-stone-600 max-w-xs truncate">
                                        {banner.ctaLink}
                                    </td>
                                    <td className="p-3 text-sm text-stone-600">{banner.displayOrder}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                                            className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 mx-auto ${banner.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-stone-100 text-stone-600'
                                                }`}
                                            title={banner.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                        >
                                            {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {banner.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/admin/banners/${banner.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50">
                                                    <Pencil className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50"
                                                onClick={() => handleDelete(banner.id, banner.ctaLink)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
