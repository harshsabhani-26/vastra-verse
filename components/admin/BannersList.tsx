"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteBanner, toggleBannerStatus, type HeroBanner } from "@/app/admin/banners/actions";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface BannersListProps {
    initialBanners: HeroBanner[];
}

export function BannersList({ initialBanners }: BannersListProps) {
    const router = useRouter();
    const [banners, setBanners] = useState(initialBanners);

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleBannerStatus(id, !currentStatus);
        if (result.success) {
            setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
            toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
        } else {
            toast.error("Failed to update banner status");
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        const result = await deleteBanner(id);
        if (result.success) {
            setBanners(prev => prev.filter(b => b.id !== id));
            toast.success("Banner deleted successfully");
            router.refresh();
        } else {
            toast.error("Failed to delete banner");
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                        <th className="text-left p-4 text-sm font-medium text-stone-700">Preview</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-700">Title</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-700">Subtitle</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-700">Button</th>
                        <th className="text-left p-4 text-sm font-medium text-stone-700">Order</th>
                        <th className="text-center p-4 text-sm font-medium text-stone-700">Status</th>
                        <th className="text-right p-4 text-sm font-medium text-stone-700">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {banners.map((banner) => (
                        <tr key={banner.id} className="border-b border-stone-200 hover:bg-stone-50">
                            <td className="p-4">
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-20 h-12 object-cover rounded"
                                />
                            </td>
                            <td className="p-4 font-medium text-stone-800">{banner.title}</td>
                            <td className="p-4 text-sm text-stone-600 max-w-xs truncate">{banner.subtitle}</td>
                            <td className="p-4 text-sm text-stone-600">
                                <div className="flex flex-col">
                                    <span className="font-medium">{banner.ctaText}</span>
                                    <span className="text-xs text-stone-500">{banner.ctaLink}</span>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-stone-600">{banner.displayOrder}</td>
                            <td className="p-4 text-center">
                                <button
                                    onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 mx-auto ${banner.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-stone-100 text-stone-600'
                                        }`}
                                    title={banner.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                >
                                    {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    {banner.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/admin/banners/${banner.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(banner.id, banner.title)}
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
    );
}
