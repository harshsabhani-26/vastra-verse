"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Upload, Save, Loader2, X } from "lucide-react";
import Image from "next/image";

interface CategoryFormProps {
    category?: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        image: string | null;
        icon: string | null;
        isFeatured: boolean;
        isActive: boolean;
    };
    mode: "add" | "edit";
}

export default function CategoryForm({ category, mode }: CategoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(category?.name || "");
    const [slug, setSlug] = useState(category?.slug || "");
    const [description, setDescription] = useState(category?.description || "");
    const [image, setImage] = useState(category?.image || "");
    const [icon, setIcon] = useState(category?.icon || "");
    const [isFeatured, setIsFeatured] = useState(category?.isFeatured || false);
    const [isActive, setIsActive] = useState(category?.isActive ?? true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);

    // Auto-generate slug from name
    useEffect(() => {
        if (mode === "add" && name && !slug) {
            const generatedSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            setSlug(generatedSlug);
        }
    }, [name, slug, mode]);

    const handleImageUpload = async (file: File, type: "image" | "icon") => {
        const setter = type === "image" ? setUploadingImage : setUploadingIcon;
        setter(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (type === "image") {
                    setImage(data.url);
                } else {
                    setIcon(data.url);
                }
            } else {
                const data = await response.json();
                alert(`Failed to upload image: ${data.details || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert("Failed to upload image. Please check your network connection.");
        } finally {
            setter(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            name,
            slug,
            description: description || null,
            image: image || null,
            icon: icon || null,
            isFeatured,
            isActive,
        };

        try {
            const url = mode === "add"
                ? "/api/categories"
                : `/api/categories/${category?.id}`;

            const method = mode === "add" ? "POST" : "PUT";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/admin/categories");
                router.refresh();
            } else {
                const error = await response.text();
                alert(`Failed to ${mode} collection: ${error}`);
            }
        } catch (error) {
            alert(`Failed to ${mode} collection`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-[#1C1917]">
                    {mode === "add" ? "Add Collection" : "Edit Collection"}
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                    {mode === "add"
                        ? "Create a new collection to organize your products"
                        : "Update collection details and settings"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">
                        Basic Information
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Collection Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Wedding Sarees"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug *</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-stone-500">/shop/</span>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="wedding-sarees"
                                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                    title="Only lowercase letters, numbers, and hyphens allowed"
                                    required
                                />
                            </div>
                            <p className="text-xs text-stone-500">
                                Auto-generated from name. Use lowercase letters, numbers, and hyphens only.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (SEO Friendly)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description for SEO and category pages..."
                                rows={4}
                                maxLength={300}
                            />
                            <p className="text-xs text-stone-500">
                                {description.length}/300 characters. Used for SEO meta description.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">
                        Images
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Featured Image */}
                        <div className="space-y-3">
                            <Label>Featured Image</Label>
                            <div className="space-y-3">
                                {image && (
                                    <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                                        <Image
                                            src={image}
                                            alt="Featured"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImage("")}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, "image");
                                        }}
                                        className="hidden"
                                        id="image-upload"
                                        disabled={uploadingImage}
                                    />
                                    <label htmlFor="image-upload">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            disabled={uploadingImage}
                                            onClick={() => document.getElementById("image-upload")?.click()}
                                        >
                                            {uploadingImage ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {image ? "Change Image" : "Upload Image"}
                                                </>
                                            )}
                                        </Button>
                                    </label>
                                </div>
                                <p className="text-xs text-stone-500">
                                    Recommended: 800x600px or 4:3 ratio
                                </p>
                            </div>
                        </div>

                        {/* Icon */}
                        <div className="space-y-3">
                            <Label>Icon (Optional)</Label>
                            <div className="space-y-3">
                                {icon && (
                                    <div className="relative h-32 w-32 bg-stone-100 rounded-lg overflow-hidden mx-auto">
                                        <Image
                                            src={icon}
                                            alt="Icon"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIcon("")}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, "icon");
                                        }}
                                        className="hidden"
                                        id="icon-upload"
                                        disabled={uploadingIcon}
                                    />
                                    <label htmlFor="icon-upload">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            disabled={uploadingIcon}
                                            onClick={() => document.getElementById("icon-upload")?.click()}
                                        >
                                            {uploadingIcon ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {icon ? "Change Icon" : "Upload Icon"}
                                                </>
                                            )}
                                        </Button>
                                    </label>
                                </div>
                                <p className="text-xs text-stone-500">
                                    Recommended: 256x256px square
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">
                        Settings
                    </h2>

                    <div className="space-y-4">
                        {/* Featured Toggle */}
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-stone-900">Featured on Homepage</h3>
                                <p className="text-sm text-stone-500">
                                    Show this collection on the homepage
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFeatured(!isFeatured)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isFeatured ? "bg-primary" : "bg-stone-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFeatured ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                            <div>
                                <h3 className="font-medium text-stone-900">Active Status</h3>
                                <p className="text-sm text-stone-500">
                                    Make this collection visible on the website
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-green-600" : "bg-red-600"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {mode === "add" ? "Creating..." : "Updating..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {mode === "add" ? "Create Collection" : "Update Collection"}
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
