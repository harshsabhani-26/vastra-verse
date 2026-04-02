"use client";

import { useState } from "react";
import { updateLiveShoppingBg } from "@/app/admin/live-shopping/actions";
import toast from "react-hot-toast";
import { Upload, Loader2, Link2, ImageIcon, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LiveShoppingBgUploadProps {
    initialBg: string;
}

export function LiveShoppingBgUpload({ initialBg }: LiveShoppingBgUploadProps) {
    const [loading, setLoading] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [inputUrl, setInputUrl] = useState("");
    const [currentBg, setCurrentBg] = useState(initialBg);

    const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File size must be less than 50MB");
            return;
        }
        setFileToUpload(file);
        setLocalPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!fileToUpload) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("folder", "live-shopping-bg");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Upload failed");
            }
            const data = await response.json();
            await updateLiveShoppingBg(data.url);
            setCurrentBg(data.url);
            setFileToUpload(null);
            setLocalPreview(null);
            toast.success("Live Shopping background updated!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUrl = async () => {
        if (!inputUrl) return;
        setLoading(true);
        try {
            await updateLiveShoppingBg(inputUrl);
            setCurrentBg(inputUrl);
            setInputUrl("");
            toast.success("Background updated!");
        } catch {
            toast.error("Failed to save URL");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            await updateLiveShoppingBg("");
            setCurrentBg("");
            toast.success("Background removed");
        } catch {
            toast.error("Failed to remove");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-red-700" />
                </div>
                <div>
                    <h2 className="font-bold text-stone-900 tracking-tight">Modal Background</h2>
                    <p className="text-xs text-stone-500">Image or video shown behind the popup. Supports JPG, PNG, WebP, MP4.</p>
                </div>
            </div>

            {/* Upload Drop Zone */}
            <div className="border border-stone-200 rounded-xl p-5 bg-stone-50 space-y-4">
                <h3 className="text-sm font-semibold text-stone-700">Upload Image or Video</h3>

                <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center bg-white hover:bg-stone-50 transition">
                    {localPreview ? (
                        <div className="space-y-3">
                            <div className="relative h-40 w-full rounded-lg overflow-hidden bg-stone-100">
                                {fileToUpload?.type.startsWith("video") ? (
                                    <video src={localPreview} className="w-full h-full object-cover" muted autoPlay loop />
                                ) : (
                                    <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex justify-center gap-2">
                                <label className="cursor-pointer border border-stone-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-100 bg-white">
                                    Change File
                                    <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleFileSelect} />
                                </label>
                                <Button size="sm" variant="outline" onClick={() => { setFileToUpload(null); setLocalPreview(null); }}>
                                    <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleUpload} disabled={loading} className="bg-red-700 hover:bg-red-800 text-white">
                                    {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                                    Upload & Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <label className="cursor-pointer block py-4">
                            <div className="flex justify-center gap-3 mb-2">
                                <ImageIcon className="w-8 h-8 text-stone-300" />
                                <Video className="w-8 h-8 text-stone-300" />
                            </div>
                            <p className="text-sm text-stone-500">Click to select image or video</p>
                            <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP, MP4, WebM — max 50MB</p>
                            <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleFileSelect} />
                        </label>
                    )}
                </div>
            </div>

            {/* URL Input */}
            <div className="border border-stone-200 rounded-xl p-5 bg-stone-50">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">Or Paste a URL</h3>
                <div className="flex gap-2">
                    <Input
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="https://example.com/background.jpg"
                        className="bg-white text-sm"
                    />
                    <Button onClick={handleSaveUrl} disabled={loading || !inputUrl} size="sm" className="flex-shrink-0">
                        <Link2 className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                </div>
            </div>

            {loading && (
                <p className="text-sm text-stone-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </p>
            )}

            {/* Current Background Preview */}
            <div className="border-t border-stone-100 pt-5">
                <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Current Background
                </h3>
                {currentBg ? (
                    <div className="space-y-3">
                        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-stone-900 border border-stone-700">
                            {isVideo(currentBg) ? (
                                <video src={currentBg} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                            ) : (
                                <img src={currentBg} alt="Current BG" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                                    Live Preview
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={loading}>
                                Remove Background
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="h-28 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center">
                        <p className="text-sm text-stone-400">No background set — gradient will be used</p>
                    </div>
                )}
            </div>
        </div>
    );
}
