"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBanner, updateBanner, type HeroBanner } from "@/app/admin/banners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Upload, Loader2 } from "lucide-react";

interface BannerFormProps {
    banner?: HeroBanner;
}

export function BannerForm({ banner }: BannerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(banner?.imageUrl || "");
    const [formData, setFormData] = useState({
        title: banner?.title || "",
        subtitle: banner?.subtitle || "",
        ctaText: banner?.ctaText || "",
        ctaLink: banner?.ctaLink || "",
        imageUrl: banner?.imageUrl || "",
        displayOrder: banner?.displayOrder || 0,
        isActive: banner?.isActive !== undefined ? banner.isActive : true
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        // For now, we'll use a data URL. In production, upload to cloud storage
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setImagePreview(dataUrl);
            setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (banner) {
                // Update existing banner
                const result = await updateBanner(banner.id, formData);
                if (result.success) {
                    toast.success("Banner updated successfully!");
                    router.push("/admin/banners");
                    router.refresh();
                } else {
                    toast.error(result.error || "Failed to update banner");
                }
            } else {
                // Create new banner
                const result = await createBanner(formData);
                if (result.success) {
                    toast.success("Banner created successfully!");
                    router.push("/admin/banners");
                    router.refresh();
                } else {
                    toast.error(result.error || "Failed to create banner");
                }
            }
        } catch (error) {
            console.error("Error saving banner:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
                <Label htmlFor="image">Banner Image *</Label>
                <div className="flex flex-col gap-4">
                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                        {imagePreview ? (
                            <div className="space-y-4">
                                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                                <Button type="button" variant="outline" onClick={() => {
                                    setImagePreview("");
                                    setFormData(prev => ({ ...prev, imageUrl: "" }));
                                }}>
                                    Change Image
                                </Button>
                            </div>
                        ) : (
                            <label htmlFor="image" className="cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto text-stone-400 mb-2" />
                                <p className="text-sm text-stone-600">Click to upload banner image</p>
                                <p className="text-xs text-stone-500 mt-1">JPG, PNG or WebP. Max size 5MB</p>
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="The Royal Weave"
                    required
                />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle *</Label>
                <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Discover the timeless elegance of handwoven heritage."
                    rows={3}
                    required
                />
            </div>

            {/* CTA Text */}
            <div className="space-y-2">
                <Label htmlFor="ctaText">Button Text *</Label>
                <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Shop Sarees"
                    required
                />
            </div>

            {/* CTA Link */}
            <div className="space-y-2">
                <Label htmlFor="ctaLink">Button Link *</Label>
                <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                    placeholder="/shop?sort=newest"
                    required
                />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                    min={0}
                />
                <p className="text-xs text-stone-500">Lower numbers appear first</p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active (show on website)</Label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading || !formData.imageUrl}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        banner ? "Update Banner" : "Create Banner"
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/banners")}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
