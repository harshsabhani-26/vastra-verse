"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, Star, RotateCw, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface ProductImageData {
    id?: string; // Database ID for existing images
    url: string;
    type: "MAIN" | "FRONT_VIEW" | "BACK_VIEW" | "BORDER_CLOSEUP" | "PALLU_CLOSEUP" | "BLOUSE_PIECE";
    position: number;
    width?: number;
    height?: number;
    fileSize?: number;
    rotation?: number; // Client-side rotation (0, 90, 180, 270)
}

interface ImageUploaderProps {
    images: ProductImageData[];
    onChange: (images: ProductImageData[]) => void;
    maxImages?: number;
    minImages?: number;
}

const IMAGE_TYPES = [
    { value: "MAIN", label: "Main Image" },
    { value: "FRONT_VIEW", label: "Front View" },
    { value: "BACK_VIEW", label: "Back View" },
    { value: "BORDER_CLOSEUP", label: "Border Close-up" },
    { value: "PALLU_CLOSEUP", label: "Pallu Close-up" },
    { value: "BLOUSE_PIECE", label: "Blouse Piece" },
];

export default function ImageUploader({
    images,
    onChange,
    maxImages = 8,
    minImages = 3,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [error, setError] = useState<string>("");
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        await uploadFiles(files);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const uploadFiles = async (files: File[]) => {
        setError("");

        // Validate count
        if (images.length + files.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        if (files.length === 0) {
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            // Upload via server-side API (Cloudinary)
            const response = await fetch('/api/products/images', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload images');
            }

            // Map response to ProductImageData format
            const newImages: ProductImageData[] = data.images.map((img: any, index: number) => ({
                url: img.url,
                type: (images.length === 0 && index === 0 ? "MAIN" : "FRONT_VIEW") as ProductImageData["type"],
                position: images.length + index,
                width: img.width,
                height: img.height,
                fileSize: img.fileSize,
                rotation: 0,
            }));

            onChange([...images, ...newImages]);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || "Failed to upload images");
        } finally {
            setUploading(false);
        }
    };

    const handleSetMain = (index: number) => {
        const updated = images.map((img, i) => ({
            ...img,
            type: i === index ? ("MAIN" as const) : img.type === "MAIN" ? ("FRONT_VIEW" as const) : img.type,
        }));
        onChange(updated);
    };

    const handleTypeChange = (index: number, type: ProductImageData["type"]) => {
        const updated = [...images];
        updated[index] = { ...updated[index], type };
        onChange(updated);
    };

    const handleRotate = (index: number) => {
        const updated = [...images];
        const currentRotation = updated[index].rotation || 0;
        updated[index] = {
            ...updated[index],
            rotation: (currentRotation + 90) % 360,
        };
        onChange(updated);
    };

    const handleDelete = async (index: number) => {
        const imageToDelete = images[index];

        // If it's an uploaded file (not yet saved to DB), delete from server
        if (imageToDelete.url && !imageToDelete.id) {
            try {
                await fetch(`/api/products/images?url=${encodeURIComponent(imageToDelete.url)}`, {
                    method: "DELETE",
                });
            } catch (err) {
                console.error("Failed to delete file:", err);
            }
        }

        const updated = images.filter((_, i) => i !== index);
        // Update positions
        const reindexed = updated.map((img, i) => ({ ...img, position: i }));
        onChange(reindexed);
    };

    // Drag and drop reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOverImage = (e: DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const items = [...images];
        const draggedItem = items[draggedIndex];
        items.splice(draggedIndex, 1);
        items.splice(index, 0, draggedItem);

        // Update positions
        const reindexed = items.map((img, i) => ({ ...img, position: i }));
        onChange(reindexed);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-stone-200 hover:border-primary/50"
                    } ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => images.length < maxImages && fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center text-center">
                    {uploading ? (
                        <>
                            <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
                            <span className="text-sm font-medium text-stone-700">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="h-10 w-10 mb-3 text-stone-400" />
                            <span className="text-sm font-medium text-stone-700">
                                {images.length >= maxImages
                                    ? `Maximum ${maxImages} images reached`
                                    : "Click to upload or drag and drop"}
                            </span>
                            <span className="text-xs text-stone-500 mt-1">
                                PNG, JPG, WebP up to 10MB each ({minImages}-{maxImages} images required)
                            </span>
                        </>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={images.length >= maxImages}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Image Count */}
            <div className="flex items-center justify-between text-sm text-stone-600">
                <span>
                    {images.length} / {maxImages} images uploaded
                    {images.length < minImages && (
                        <span className="text-red-600 ml-2">
                            (Minimum {minImages} required)
                        </span>
                    )}
                </span>
                {images.length > 0 && (
                    <span className="text-xs text-stone-500">Drag to reorder</span>
                )}
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={`${image.url}-${index}`}
                            className="relative group border border-stone-200 rounded-lg overflow-hidden bg-stone-50 cursor-move"
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOverImage(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Image Preview */}
                            <div className="aspect-square relative bg-stone-100">
                                <Image
                                    src={image.url}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    style={{
                                        transform: `rotate(${image.rotation || 0}deg)`,
                                    }}
                                />
                                {/* Main Badge */}
                                {image.type === "MAIN" && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-white" />
                                        Main
                                    </div>
                                )}
                                {/* Drag Handle */}
                                <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Image Controls */}
                            <div className="p-2 space-y-2">
                                {/* Type Selector */}
                                <select
                                    value={image.type}
                                    onChange={(e) =>
                                        handleTypeChange(
                                            index,
                                            e.target.value as ProductImageData["type"]
                                        )
                                    }
                                    className="w-full text-xs border border-stone-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {IMAGE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Action Buttons */}
                                <div className="flex gap-1">
                                    {image.type !== "MAIN" && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSetMain(index)}
                                            className="flex-1 h-7 text-xs"
                                        >
                                            <Star className="w-3 h-3 mr-1" />
                                            Set Main
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRotate(index)}
                                        className="h-7 px-2"
                                    >
                                        <RotateCw className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDelete(index)}
                                        className="h-7 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
