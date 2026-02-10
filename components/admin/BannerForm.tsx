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
    const [videoPreview, setVideoPreview] = useState(banner?.videoUrl || "");
    const [formData, setFormData] = useState({
        ctaLink: banner?.ctaLink || "",
        mediaType: (banner?.mediaType as "IMAGE" | "VIDEO") || "IMAGE",
        imageUrl: banner?.imageUrl || "",
        videoUrl: banner?.videoUrl || "",
        // Banner Type
        bannerType: (banner?.bannerType as "HERO" | "MID_PAGE" | "BOTTOM_PAGE") || "HERO",
        displayOrder: banner?.displayOrder || 0,
        isActive: banner?.isActive !== undefined ? banner.isActive : true
    });

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "hero");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await response.json();
            setImagePreview(data.url);
            setFormData(prev => ({ ...prev, imageUrl: data.url }));
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload image");
        } finally {
            setLoading(false);
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast.error("Please select a video file");
            return;
        }

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Video size must be less than 50MB");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "videos");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await response.json();
            setVideoPreview(data.url);
            setFormData(prev => ({ ...prev, videoUrl: data.url }));
            toast.success("Video uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload video");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare data for submission - ensure it matches Omit<HeroBanner, 'id'>
            const bannerData = {
                ctaLink: formData.ctaLink,
                mediaType: formData.mediaType,
                imageUrl: formData.imageUrl,
                videoUrl: formData.videoUrl || null,
                bannerType: formData.bannerType,
                displayOrder: formData.displayOrder,
                isActive: formData.isActive,
            };

            if (banner) {
                // Update existing banner
                const result = await updateBanner(banner.id, bannerData);
                if (result.success) {
                    toast.success("Banner updated successfully!");
                    router.push("/admin/banners");
                } else {
                    toast.error(result.error || "Failed to update banner");
                }
            } else {
                // Create new banner
                const result = await createBanner(bannerData);
                if (result.success) {
                    toast.success("Banner created successfully!");
                    router.push("/admin/banners");
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
            {/* Media Type Selection */}
            <div className="space-y-2">
                <Label htmlFor="mediaType">Media Type *</Label>
                <select
                    id="mediaType"
                    value={formData.mediaType}
                    onChange={(e) => {
                        const newType = e.target.value as "IMAGE" | "VIDEO";
                        setFormData(prev => ({ ...prev, mediaType: newType }));
                        // Reset previews when switching types
                        if (newType === "IMAGE") {
                            setVideoPreview("");
                            setFormData(prev => ({ ...prev, videoUrl: "" }));
                        } else {
                            setImagePreview("");
                            setFormData(prev => ({ ...prev, imageUrl: "" }));
                        }
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                </select>
            </div>

            {/* Banner Type Selection */}
            <div className="space-y-2">
                <Label htmlFor="bannerType">Banner Type *</Label>
                <select
                    id="bannerType"
                    value={formData.bannerType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bannerType: e.target.value as "HERO" | "MID_PAGE" | "BOTTOM_PAGE" }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                >
                    <option value="HERO">Hero Banner (Top of page)</option>
                    <option value="MID_PAGE">Mid-Page Banner (Between categories & best sellers)</option>
                    <option value="BOTTOM_PAGE">Bottom Banner (Between best sellers & appointment)</option>
                </select>
                <p className="text-xs text-stone-500">Choose where this banner will display on the homepage</p>
            </div>

            {/* Image Upload - Show only when IMAGE is selected */}
            {formData.mediaType === "IMAGE" && (
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
            )}

            {/* Video Upload - Show only when VIDEO is selected */}
            {formData.mediaType === "VIDEO" && (
                <div className="space-y-2">
                    <Label htmlFor="video">Banner Video *</Label>
                    <div className="flex flex-col gap-4">
                        <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                            {videoPreview ? (
                                <div className="space-y-4">
                                    <video src={videoPreview} controls className="max-h-48 mx-auto rounded" />
                                    <Button type="button" variant="outline" onClick={() => {
                                        setVideoPreview("");
                                        setFormData(prev => ({ ...prev, videoUrl: "" }));
                                    }}>
                                        Change Video
                                    </Button>
                                </div>
                            ) : (
                                <label htmlFor="video" className="cursor-pointer">
                                    <Upload className="w-12 h-12 mx-auto text-stone-400 mb-2" />
                                    <p className="text-sm text-stone-600">Click to upload banner video</p>
                                    <p className="text-xs text-stone-500 mt-1">MP4 or WebM. Max size 50MB</p>
                                    <input
                                        id="video"
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleVideoChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Link */}
            <div className="space-y-2">
                <Label htmlFor="ctaLink">Banner Link *</Label>
                <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                    placeholder="/shop?sort=newest"
                    required
                />
                <p className="text-xs text-stone-500">Users will be redirected to this link when they click on the banner</p>
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
                <Button
                    type="submit"
                    disabled={
                        loading ||
                        (formData.mediaType === "IMAGE" && !formData.imageUrl) ||
                        (formData.mediaType === "VIDEO" && !formData.videoUrl)
                    }
                >
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
