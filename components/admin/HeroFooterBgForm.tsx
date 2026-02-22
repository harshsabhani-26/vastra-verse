"use client";

import { useState } from "react";
import { updateHeroBg, updateFooterBg, updateLogo, updateFooterLogo } from "@/app/admin/hero-footer-bg/actions";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Upload, Loader2, Link2, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeroFooterBgFormProps {
    initialUrl: string;
    type: "hero" | "footer" | "logo" | "footerLogo";
}

export function HeroFooterBgForm({ initialUrl, type }: HeroFooterBgFormProps) {
    const [loading, setLoading] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [inputUrl, setInputUrl] = useState("");

    const updateAction = type === "hero" ? updateHeroBg : type === "footer" ? updateFooterBg : type === "logo" ? updateLogo : updateFooterLogo;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setFileToUpload(file);
        setLocalPreview(URL.createObjectURL(file));
    };

    const handleCreateBg = async () => {
        if (!fileToUpload) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("folder", "hero-footer-bg");

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
            await updateAction(data.url);

            setFileToUpload(null);
            setLocalPreview(null);
            toast.success(`${type === "hero" ? "Hero" : type === "footer" ? "Footer" : type === "logo" ? "Main Logo" : "Footer Logo"} updated successfully`);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload image");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUrl = async () => {
        if (!inputUrl) return;
        setLoading(true);
        try {
            await updateAction(inputUrl);
            setInputUrl("");
            toast.success(`${type === "hero" ? "Hero" : type === "footer" ? "Footer" : type === "logo" ? "Main Logo" : "Footer Logo"} updated successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update background image");
        } finally {
            setLoading(false);
        }
    }

    const handleRemoveCurrent = async () => {
        setLoading(true);
        try {
            await updateAction("");
            toast.success(`Removed successfully`);
        } catch (error) {
            toast.error("Failed to remove");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col gap-4">
                <div className="border border-stone-200 rounded-lg p-6 bg-stone-50">
                    <h3 className="text-sm font-medium text-stone-700 mb-2">
                        {type === 'logo' || type === 'footerLogo' ? 'Upload Store Logo' : 'Upload SVG/Image Background'}
                    </h3>
                    <p className="text-xs text-stone-500 mb-4">
                        {type === 'logo' || type === 'footerLogo'
                            ? 'Select the primary logo for your store navigation and checkout.'
                            : 'Select an SVG or image file to be used as a medium opacity background.'}
                    </p>

                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center bg-white transition hover:bg-stone-50">
                        {localPreview ? (
                            <div className="space-y-4">
                                <div className="relative h-48 w-full bg-[#FAFAFA] rounded-md overflow-hidden border border-stone-200 flex items-center justify-center">
                                    <div
                                        className="absolute inset-0 z-0 w-full max-w-full"
                                        style={{
                                            backgroundImage: `url("${localPreview}#svgView(preserveAspectRatio(none))")`,
                                            backgroundSize: type === 'logo' || type === 'footerLogo' ? 'contain' : '100% 100%',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            opacity: type === 'logo' || type === 'footerLogo' ? 1 : 0.15
                                        }}
                                    ></div>
                                    <span className="relative z-10 font-bold text-xl text-stone-800 tracking-tight bg-white/80 px-4 py-1 rounded">
                                        Preview Selection
                                    </span>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <label className="cursor-pointer border border-stone-300 px-4 py-2 rounded-md text-sm hover:bg-stone-100 bg-white inline-flex items-center">
                                        Change File
                                        <input
                                            type="file"
                                            accept="image/*,.svg"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setFileToUpload(null);
                                        setLocalPreview(null);
                                    }}>Cancel</Button>
                                    <Button type="button" onClick={handleCreateBg} disabled={loading} className="bg-black hover:bg-stone-800">
                                        CREATE BG
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <label className="cursor-pointer block py-4">
                                <Upload className="w-12 h-12 mx-auto text-stone-400 mb-2" />
                                <p className="text-sm text-stone-600">Click to select SVG or Image</p>
                                <p className="text-xs text-stone-500 mt-1">SVG, PNG, JPG. Max size 5MB</p>
                                <input
                                    type="file"
                                    accept="image/*,.svg"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="border border-stone-200 rounded-lg p-6 bg-stone-50">
                    <h3 className="text-sm font-medium text-stone-700 mb-2">Or Provide an Image URL Link</h3>
                    <div className="flex gap-2 items-center">
                        <Input
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://example.com/flower.svg"
                            className="bg-white"
                        />
                        <Button type="button" onClick={handleSaveUrl} disabled={loading || !inputUrl}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Save Link
                        </Button>
                    </div>
                </div>
            </div>

            {loading && <p className="text-sm text-stone-500 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</p>}

            {/* Current Available Background */}
            <div className="mt-8 border-t border-stone-200 pt-6">
                <h3 className="text-lg font-bold tracking-tight text-[#1C1917] mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-stone-500" /> Current Available {type === "hero" ? "Hero" : type === "footer" ? "Footer" : type === "logo" ? "Main Logo" : "Footer Logo"}
                </h3>

                {initialUrl ? (
                    <div className="space-y-4">
                        <div className="relative h-64 w-full bg-[#1A1A1A] rounded-lg overflow-hidden border border-stone-800 flex items-center justify-center">
                            <div
                                className="absolute inset-0 z-0 w-full max-w-full"
                                style={{
                                    backgroundImage: `url("${initialUrl}#svgView(preserveAspectRatio(none))")`,
                                    backgroundSize: type === 'logo' || type === 'footerLogo' ? 'contain' : '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    opacity: type === 'logo' || type === 'footerLogo' ? 1 : 0.15
                                }}
                            ></div>
                            <span className="relative z-10 font-sans text-sm text-white/80 tracking-widest uppercase py-2 px-6 border border-white/20 rounded-full bg-black/40 backdrop-blur-sm">
                                Live Preview
                            </span>
                        </div>
                        <div className="flex justify-end">
                            <Button type="button" variant="destructive" size="sm" onClick={handleRemoveCurrent} disabled={loading}>
                                Remove Current Background
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="h-32 rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center">
                        <p className="text-sm text-stone-500">No {type === "logo" || type === 'footerLogo' ? "logo" : "background"} currently set</p>
                    </div>
                )}
            </div>
        </div>
    );
}
