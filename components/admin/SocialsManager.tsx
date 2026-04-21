"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, Pencil, Trash2, Eye, EyeOff, Upload, GripVertical,
    Loader2, Video, Image as ImageIcon, Link as LinkIcon
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import Image from "next/image";
import {
    createSocialImage, updateSocialImage, deleteSocialImage,
    toggleSocialImageStatus, reorderSocialImages,
    createSocialVideo, updateSocialVideo, deleteSocialVideo,
    toggleSocialVideoStatus, reorderSocialVideos,
    type SocialImage, type SocialVideo,
} from "@/app/admin/socials/actions";

interface SocialsManagerProps {
    initialImages: SocialImage[];
    initialVideos: SocialVideo[];
    products: any[];
}

// ─── Tab Types ────────────────────────────────────────────────────────────────

type Tab = "images" | "videos";

// ─── Main Component ───────────────────────────────────────────────────────────

export function SocialsManager({ initialImages, initialVideos, products }: SocialsManagerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("images");

    return (
        <div className="space-y-6">
            {/* Tab Bar */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-stone-200">
                    <button
                        onClick={() => setActiveTab("images")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "images"
                            ? "border-amber-500 text-amber-700 bg-amber-50/50"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                    >
                        <ImageIcon size={16} />
                        Social Images
                        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-600">
                            max 4 shown
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("videos")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "videos"
                            ? "border-amber-500 text-amber-700 bg-amber-50/50"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                    >
                        <Video size={16} />
                        Social Videos
                        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-stone-100 text-stone-600">
                            max 7 shown
                        </span>
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "images" && (
                        <ImagesTab initialImages={initialImages} products={products} />
                    )}
                    {activeTab === "videos" && (
                        <VideosTab initialVideos={initialVideos} products={products} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sortable Image Row ───────────────────────────────────────────────────────

function SortableImageRow({
    img,
    onToggle,
    onEdit,
    onDelete,
}: {
    img: SocialImage;
    onToggle: (id: string, current: boolean) => void;
    onEdit: (img: SocialImage) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : undefined };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg p-4 flex items-center gap-4 transition-shadow ${isDragging ? 'shadow-xl border-amber-300' : 'border-stone-200 hover:border-stone-300'
                }`}
        >
            <button {...attributes} {...listeners}
                className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
                title="Drag to reorder">
                <GripVertical className="h-5 w-5" />
            </button>

            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                <Image src={img.imageFile} alt={img.title || 'Social image'} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 text-sm truncate">{img.title || <span className="text-stone-400 italic">No title</span>}</p>
                {img.redirectUrl && (
                    <a href={img.redirectUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline truncate block max-w-[240px] mt-0.5">
                        {img.redirectUrl}
                    </a>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => onToggle(img.id, img.isActive)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${img.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                        }`}>
                    {img.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {img.isActive ? 'Active' : 'Hidden'}
                </button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(img)} className="hover:bg-blue-50">
                    <Pencil className="w-5 h-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(img.id)} className="hover:bg-red-50">
                    <Trash2 className="w-5 h-5 text-red-600" />
                </Button>
            </div>
        </div>
    );
}

// ─── Sortable Video Row ───────────────────────────────────────────────────────

function SortableVideoRow({
    v,
    onToggle,
    onEdit,
    onDelete,
}: {
    v: SocialVideo;
    onToggle: (id: string, current: boolean) => void;
    onEdit: (v: SocialVideo) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: v.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : undefined };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg p-4 flex items-center gap-4 transition-shadow ${isDragging ? 'shadow-xl border-amber-300' : 'border-stone-200 hover:border-stone-300'
                }`}
        >
            <button {...attributes} {...listeners}
                className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
                title="Drag to reorder">
                <GripVertical className="h-5 w-5" />
            </button>

            <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
                {v.thumbnail ? <Image src={v.thumbnail} alt="Thumbnail" fill className="object-cover" /> : <Video className="w-6 h-6" />}
            </div>

            <div className="flex-1 min-w-0">
                {v.overlayText
                    ? <p className="text-sm font-medium text-stone-800 truncate">{v.overlayText}</p>
                    : <p className="text-base text-stone-400 italic">No overlay</p>}
                <p className="text-sm text-stone-500 mt-0.5">{v.videoFile ? '📁 Uploaded file' : '🔗 External URL'}</p>
                {v.redirectUrl && (
                    <a href={v.redirectUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline truncate block max-w-[200px] mt-0.5">
                        {v.redirectUrl}
                    </a>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => onToggle(v.id, v.isActive)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${v.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                        }`}>
                    {v.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {v.isActive ? 'Active' : 'Hidden'}
                </button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(v)} className="hover:bg-blue-50">
                    <Pencil className="w-5 h-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(v.id)} className="hover:bg-red-50">
                    <Trash2 className="w-5 h-5 text-red-600" />
                </Button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ImagesTab({ initialImages, products }: { initialImages: SocialImage[], products: any[] }) {
    const router = useRouter();
    const [images, setImages] = useState<SocialImage[]>(initialImages);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [imageFile, setImageFile] = useState("");
    const [title, setTitle] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setImageFile(""); setTitle(""); setRedirectUrl(""); setIsActive(true);
        setEditingId(null); setIsFormOpen(false);
    };

    const handleEdit = (img: SocialImage) => {
        setImageFile(img.imageFile); setTitle(img.title || "");
        setRedirectUrl(img.redirectUrl || ""); setIsActive(img.isActive);
        setEditingId(img.id); setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be < 5MB"); return; }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "socials");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setImageFile(data.url);
            toast.success("Image uploaded");
        } catch { toast.error("Failed to upload image"); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) return toast.error("Image is required");

        const activeCount = images.filter(i => i.isActive).length;
        if (isActive && !editingId && activeCount >= 4) {
            return toast.error("Maximum 4 active images. Deactivate one first.");
        }
        if (isActive && editingId) {
            const current = images.find(i => i.id === editingId);
            if (current && !current.isActive && activeCount >= 4) {
                return toast.error("Maximum 4 active images. Deactivate one first.");
            }
        }

        setLoading(true);
        try {
            const payload = {
                imageFile,
                title: title || null,
                redirectUrl: redirectUrl || null,
                isActive,
            };
            if (editingId) {
                const res = await updateSocialImage(editingId, payload);
                if (res.success) { toast.success("Image updated"); router.refresh(); resetForm(); }
                else toast.error(res.error || "Failed");
            } else {
                const res = await createSocialImage({ ...payload, displayOrder: images.length });
                if (res.success) { toast.success("Image added"); router.refresh(); resetForm(); }
                else toast.error(res.error || "Failed");
            }
        } catch { toast.error("Unexpected error"); }
        finally { setLoading(false); }
    };

    const handleToggle = async (id: string, current: boolean) => {
        if (!current && images.filter(i => i.isActive).length >= 4) {
            return toast.error("Maximum 4 images can be active.");
        }
        const res = await toggleSocialImageStatus(id, !current);
        if (res.success) {
            setImages(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i));
            toast.success(`Image ${!current ? "activated" : "deactivated"}`);
            router.refresh();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this image?")) return;
        const res = await deleteSocialImage(id);
        if (res.success) { setImages(prev => prev.filter(i => i.id !== id)); toast.success("Deleted"); router.refresh(); }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = images.findIndex(i => i.id === active.id);
        const newIndex = images.findIndex(i => i.id === over.id);
        const next = arrayMove(images, oldIndex, newIndex);
        setImages(next);
        const res = await reorderSocialImages(next.map(i => i.id));
        if (!res.success) toast.error('Reorder failed');
        else router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            {!isFormOpen && (
                <div className="flex justify-between items-center bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div>
                        <p className="text-sm font-medium text-stone-600">
                            Total: <span className="text-stone-800">{images.length}</span> &nbsp;·&nbsp;
                            Active: <span className="text-emerald-600">{images.filter(i => i.isActive).length}</span> / 4 shown on homepage
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#1C1917] hover:bg-stone-800 text-white flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Image
                    </Button>
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold tracking-tight text-[#1C1917]">
                            {editingId ? "Edit Image" : "New Social Image"}
                        </h3>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Image *</Label>
                                <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center h-[220px] flex flex-col justify-center items-center bg-white">
                                    {imageFile ? (
                                        <div className="space-y-3 w-full flex flex-col items-center">
                                            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                                <Image src={imageFile} alt="Preview" fill className="object-cover" />
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setImageFile("")}>
                                                Change Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                                            <span className="text-sm text-stone-600 block">Click to upload image</span>
                                            <span className="text-xs text-stone-400 mt-1 block">Square or portrait · JPG/PNG/WebP · Max 5MB</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title (optional overlay text)</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Collection" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <LinkIcon size={13} /> Redirect URL (optional)
                                    </Label>
                                    <Input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox" id="imgActive"
                                        checked={isActive} onChange={e => setIsActive(e.target.checked)}
                                        className="rounded text-[#1C1917]"
                                    />
                                    <Label htmlFor="imgActive" className="cursor-pointer">Active (show on homepage)</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" className="bg-[#1C1917] hover:bg-stone-800" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Save Changes" : "Add Image"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Image List — Drag & Drop */}
            {!isFormOpen && images.length > 0 && (
                <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                        <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> Drag and drop to reorder images shown on the Social Wall.</p>
                    </div>
                    <DndContext id="social-images-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={images.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {images.map(img => (
                                    <SortableImageRow
                                        key={img.id}
                                        img={img}
                                        onToggle={handleToggle}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {!isFormOpen && images.length === 0 && (
                <div className="text-center py-16 text-stone-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No social images yet. Add your first image.</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEOS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function VideosTab({ initialVideos, products }: { initialVideos: SocialVideo[], products: any[] }) {
    const router = useRouter();
    const [videos, setVideos] = useState<SocialVideo[]>(initialVideos);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [videoType, setVideoType] = useState<"FILE" | "URL">("FILE");
    const [videoFile, setVideoFile] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [overlayText, setOverlayText] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setVideoType("FILE"); setVideoFile(""); setVideoUrl(""); setThumbnail("");
        setOverlayText(""); setRedirectUrl(""); setIsActive(true);
        setEditingId(null); setIsFormOpen(false);
    };

    const handleEdit = (v: SocialVideo) => {
        setVideoType(v.videoFile ? "FILE" : "URL");
        setVideoFile(v.videoFile || ""); setVideoUrl(v.videoUrl || "");
        setThumbnail(v.thumbnail); setOverlayText(v.overlayText || "");
        setRedirectUrl(v.redirectUrl || ""); setIsActive(v.isActive);
        setEditingId(v.id); setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };



    const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please select an image for thumbnail"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be < 5MB"); return; }
        setLoading(true);
        const fd = new FormData();
        fd.append("file", file); fd.append("folder", "socials");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setThumbnail(data.url);
            toast.success("Thumbnail uploaded");
        } catch { toast.error("Failed to upload thumbnail"); }
        finally { setLoading(false); }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
        if (file.size > 100 * 1024 * 1024) { toast.error("Video must be < 100MB"); return; }
        setLoading(true);
        const fd = new FormData();
        fd.append("file", file); fd.append("folder", "videos");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setVideoFile(data.url);
            toast.success("Video uploaded");
        } catch { toast.error("Failed to upload video"); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!thumbnail) return toast.error("Thumbnail is required");
        if (videoType === "FILE" && !videoFile) return toast.error("Video file is required");
        if (videoType === "URL" && !videoUrl) return toast.error("Video URL is required");

        const activeCount = videos.filter(v => v.isActive).length;
        if (isActive && !editingId && activeCount >= 7) return toast.error("Maximum 7 active videos.");

        setLoading(true);
        try {
            const payload = {
                videoFile: videoType === "FILE" ? videoFile : null,
                videoUrl: videoType === "URL" ? videoUrl : null,
                thumbnail,
                overlayText: overlayText || null,
                redirectUrl: redirectUrl || null,
                isActive,
            };
            if (editingId) {
                const res = await updateSocialVideo(editingId, payload);
                if (res.success) { toast.success("Video updated"); router.refresh(); resetForm(); }
                else toast.error(res.error || "Failed");
            } else {
                const res = await createSocialVideo({ ...payload, displayOrder: videos.length });
                if (res.success) { toast.success("Video added"); router.refresh(); resetForm(); }
                else toast.error(res.error || "Failed");
            }
        } catch { toast.error("Unexpected error"); }
        finally { setLoading(false); }
    };

    const handleToggle = async (id: string, current: boolean) => {
        if (!current && videos.filter(v => v.isActive).length >= 7) {
            return toast.error("Maximum 7 videos can be active.");
        }
        const res = await toggleSocialVideoStatus(id, !current);
        if (res.success) {
            setVideos(prev => prev.map(v => v.id === id ? { ...v, isActive: !current } : v));
            toast.success(`Video ${!current ? "activated" : "deactivated"}`);
            router.refresh();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this video?")) return;
        const res = await deleteSocialVideo(id);
        if (res.success) { setVideos(prev => prev.filter(v => v.id !== id)); toast.success("Deleted"); router.refresh(); }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = videos.findIndex(v => v.id === active.id);
        const newIndex = videos.findIndex(v => v.id === over.id);
        const next = arrayMove(videos, oldIndex, newIndex);
        setVideos(next);
        const res = await reorderSocialVideos(next.map(v => v.id));
        if (!res.success) toast.error('Reorder failed');
        else router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            {!isFormOpen && (
                <div className="flex justify-between items-center bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div>
                        <p className="text-sm font-medium text-stone-600">
                            Total: <span className="text-stone-800">{videos.length}</span> &nbsp;·&nbsp;
                            Active: <span className="text-emerald-600">{videos.filter(v => v.isActive).length}</span> / 7 shown on homepage
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#1C1917] hover:bg-stone-800 text-white flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Video
                    </Button>
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold tracking-tight text-[#1C1917]">
                            {editingId ? "Edit Video" : "New Social Video"}
                        </h3>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Video Source Toggle */}
                        <div className="space-y-3">
                            <Label>Video Source *</Label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={videoType === "FILE"} onChange={() => setVideoType("FILE")} className="text-[#1C1917]" />
                                    <span className="text-sm">Upload File</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={videoType === "URL"} onChange={() => setVideoType("URL")} className="text-[#1C1917]" />
                                    <span className="text-sm">External URL</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Video Input */}
                            <div className="space-y-2">
                                <Label>{videoType === "FILE" ? "Upload Video" : "Video URL"} *</Label>
                                {videoType === "URL" ? (
                                    <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/... or direct video URL" />
                                ) : (
                                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center h-[160px] flex flex-col justify-center items-center bg-white">
                                        {videoFile ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                                                    <Video size={20} /> Video Ready
                                                </div>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setVideoFile("")}>Change Video</Button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                                                <span className="text-sm text-stone-600 block">Click to upload video</span>
                                                <span className="text-xs text-stone-400 mt-1 block">MP4/WebM · Max 100MB</span>
                                                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Upload */}
                            <div className="space-y-2">
                                <Label>Thumbnail Image *</Label>
                                <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center h-[160px] flex flex-col justify-center items-center bg-white">
                                    {thumbnail ? (
                                        <div className="space-y-3 w-full flex flex-col items-center">
                                            <div className="relative w-16 h-24 rounded-lg overflow-hidden">
                                                <Image src={thumbnail} alt="Thumbnail" fill className="object-cover" />
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setThumbnail("")}>Change</Button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                                            <span className="text-sm text-stone-600 block">Portrait thumbnail</span>
                                            <span className="text-xs text-stone-400 mt-1 block">JPG/PNG/WebP · Max 5MB</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Overlay Text (optional)</Label>
                                <Input value={overlayText} onChange={e => setOverlayText(e.target.value)} placeholder="e.g. Summer Vibes" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><LinkIcon size={13} /> Shop Now Link (optional)</Label>
                                <Input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="vidActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                            <Label htmlFor="vidActive" className="cursor-pointer">Active (show on homepage)</Label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" className="bg-[#1C1917] hover:bg-stone-800" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Save Changes" : "Add Video"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Video List — Drag & Drop */}
            {!isFormOpen && videos.length > 0 && (
                <div className="space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                        <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> Drag and drop to reorder videos shown on the Social Wall.</p>
                    </div>
                    <DndContext id="social-videos-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {videos.map(v => (
                                    <SortableVideoRow
                                        key={v.id}
                                        v={v}
                                        onToggle={handleToggle}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {!isFormOpen && videos.length === 0 && (
                <div className="text-center py-16 text-stone-400">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No social videos yet. Add your first video card.</p>
                </div>
            )}
        </div>
    );
}
