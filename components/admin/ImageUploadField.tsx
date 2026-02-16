"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
    Upload,
    X,
    AlertTriangle,
    CheckCircle,
    Info,
    ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    type ImageType,
    IMAGE_CONFIGS,
    validateImageFile,
    validateImageDimensions,
    getRecommendedDimensions,
    getMaxFileSize,
    formatFileSize,
} from "@/lib/image-validation";

interface ImageUploadFieldProps {
    /** The type of image being uploaded */
    imageType: ImageType;
    /** Current image URL (for edit mode) */
    currentImage?: string;
    /** Callback when file is selected and validated */
    onFileSelect: (file: File) => void;
    /** Callback when image is removed */
    onRemove?: () => void;
    /** Optional label override */
    label?: string;
    /** Whether the field is disabled */
    disabled?: boolean;
}

/**
 * Reusable image upload field with validation, preview, and dimension hints.
 * 
 * Features:
 * - Drag & drop support
 * - File format/size validation
 * - Image dimension validation
 * - Live preview
 * - Recommended dimensions hint
 * - Error/warning display
 */
export default function ImageUploadField({
    imageType,
    currentImage,
    onFileSelect,
    onRemove,
    label,
    disabled = false,
}: ImageUploadFieldProps) {
    const config = IMAGE_CONFIGS[imageType];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [validating, setValidating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        setErrors([]);
        setWarnings([]);
        setValidating(true);
        setFileName(file.name);
        setFileSize(file.size);

        // Step 1: File validation (sync)
        const fileResult = validateImageFile(file, imageType);
        if (!fileResult.valid) {
            setErrors(fileResult.errors);
            setWarnings(fileResult.warnings);
            setValidating(false);
            return;
        }

        // Step 2: Dimension validation (async)
        const dimResult = await validateImageDimensions(file, imageType);
        setWarnings([...fileResult.warnings, ...dimResult.warnings]);

        if (!dimResult.valid) {
            setErrors(dimResult.errors);
            setValidating(false);
            return;
        }

        // Step 3: Generate preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Step 4: Notify parent
        onFileSelect(file);
        setValidating(false);
    }, [imageType, onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [disabled, handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        setPreview(null);
        setFileName("");
        setFileSize(0);
        setErrors([]);
        setWarnings([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onRemove?.();
    };

    const displayImage = preview || currentImage;

    return (
        <div className="space-y-3">
            {/* Label */}
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {label || config.label}
            </label>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    relative border-2 border-dashed rounded-lg transition-all duration-200
                    ${isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-stone-300 hover:border-stone-400 bg-stone-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                {displayImage ? (
                    /* Image Preview */
                    <div className="relative p-4">
                        <div
                            className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-sm"
                            style={{
                                maxWidth: imageType === 'hero-banner' ? '100%' : '300px',
                                aspectRatio: imageType === 'product' ? '4/5'
                                    : imageType === 'category' ? '1/1'
                                        : '16/5',
                            }}
                        >
                            <Image
                                src={displayImage}
                                alt="Preview"
                                fill
                                className="object-cover"
                                sizes="300px"
                                unoptimized={displayImage.startsWith('data:')}
                            />
                        </div>

                        {/* File info */}
                        {fileName && (
                            <div className="mt-3 text-center">
                                <p className="text-sm text-stone-600 truncate max-w-[300px] mx-auto">
                                    {fileName}
                                </p>
                                <p className="text-xs text-stone-400">
                                    {formatFileSize(fileSize)}
                                </p>
                            </div>
                        )}

                        {/* Remove button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    /* Upload Prompt */
                    <div className="flex flex-col items-center gap-3 py-10 px-6">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Upload className="w-6 h-6 text-stone-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-stone-700">
                                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
                            </p>
                            <p className="text-xs text-stone-400 mt-1">
                                JPG, PNG, WebP · Max {getMaxFileSize(imageType)}
                            </p>
                        </div>
                        {validating && (
                            <p className="text-xs text-blue-500 animate-pulse">
                                Validating image...
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={config.allowedFormats.join(',')}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Recommended dimensions hint */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                    Recommended: {getRecommendedDimensions(imageType)}
                </span>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="space-y-1">
                    {errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{err}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="space-y-1">
                    {warnings.map((warn, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{warn}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
