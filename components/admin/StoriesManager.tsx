"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, GripVertical, ExternalLink, Loader2, Video } from "lucide-react";
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
    createStory,
    updateStory,
    deleteStory,
    toggleStoryStatus,
    reorderStories,
    type StoryWithProduct
} from "@/app/admin/stories/actions";

interface StoriesManagerProps {
    initialStories: StoryWithProduct[];
    products: {
        id: string;
        name: string;
        price: number;
        finalPrice: number | null;
        images: { url: string }[];
    }[];
}

// ─── Sortable Story Row ──────────────────────────────────────────────────────

function SortableStoryRow({
    story,
    onToggle,
    onEdit,
    onDelete,
}: {
    story: StoryWithProduct;
    onToggle: (id: string, current: boolean) => void;
    onEdit: (story: StoryWithProduct) => void;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: story.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg p-4 flex items-center gap-4 transition-shadow ${isDragging ? 'shadow-xl border-amber-300' : 'border-stone-200 hover:border-stone-300'
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
                title="Drag to reorder"
            >
                <GripVertical className="h-6 w-6" />
            </button>

            {/* Thumbnail */}
            <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                {story.thumbnailImage ? (
                    <Image src={story.thumbnailImage} alt={story.title} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">No Img</div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-sm truncate">{story.title}</p>
                {story.product ? (
                    <p className="text-sm text-stone-500 mt-0.5 truncate">Linked: {story.product.name}</p>
                ) : (
                    <p className="text-sm text-stone-400 mt-0.5 italic">No product linked</p>
                )}
                {story.price && (
                    <p className="text-sm font-semibold text-stone-600 mt-0.5">₹{story.price.toLocaleString('en-IN')}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status badge */}
                <button
                    onClick={() => onToggle(story.id, story.isActive)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${story.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                        }`}
                >
                    {story.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {story.isActive ? 'Active' : 'Hidden'}
                </button>

                {story.product && (
                    <a href={`/shop/${story.product.id}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" title="View product" className="hover:bg-blue-50">
                            <ExternalLink className="w-5 h-5 text-blue-500" />
                        </Button>
                    </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => onEdit(story)} className="hover:bg-blue-50">
                    <Pencil className="w-5 h-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(story.id)} className="hover:bg-red-50">
                    <Trash2 className="w-5 h-5 text-red-600" />
                </Button>
            </div>
        </div>
    );
}


export function StoriesManager({ initialStories, products }: StoriesManagerProps) {
    const router = useRouter();
    const [stories, setStories] = useState<StoryWithProduct[]>(initialStories);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [videoFile, setVideoFile] = useState("");
    const [videoType, setVideoType] = useState<"FILE" | "URL">("FILE");
    const [thumbnailImage, setThumbnailImage] = useState("");
    const [productId, setProductId] = useState("");
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setTitle("");
        setVideoUrl("");
        setVideoFile("");
        setVideoType("FILE");
        setThumbnailImage("");
        setProductId("");
        setIsActive(true);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (story: StoryWithProduct) => {
        setTitle(story.title);
        setVideoUrl(story.videoUrl || "");
        setVideoFile(story.videoFile || "");
        setVideoType(story.videoFile ? "FILE" : "URL");
        setThumbnailImage(story.thumbnailImage);
        setProductId(story.productId || "");
        setIsActive(story.isActive);
        setEditingId(story.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setProductId(id);

        if (id) {
            const product = products.find(p => p.id === id);
            // Auto fetch title optionally, but doing it by default if empty helps admin
            if (product && (!title || title.trim() === "")) {
                setTitle(product.name);
            }
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file for thumbnail");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Thumbnail size must be less than 5MB");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "hero");

        try {
            const response = await fetch("/api/upload", { method: "POST", body: formData });
            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setThumbnailImage(data.url);
            toast.success("Thumbnail uploaded");
        } catch (error) {
            toast.error("Failed to upload thumbnail");
        } finally {
            setLoading(false);
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error("Please select a video file");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Video size must be less than 50MB");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "videos");

        try {
            const response = await fetch("/api/upload", { method: "POST", body: formData });
            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setVideoFile(data.url);
            toast.success("Video uploaded");
        } catch (error) {
            toast.error("Failed to upload video");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title) return toast.error("Title is required");
        if (!thumbnailImage) return toast.error("Thumbnail is required");
        if (videoType === "FILE" && !videoFile) return toast.error("Video file is required");
        if (videoType === "URL" && !videoUrl) return toast.error("Video URL is required");

        // Active stories limit validation
        const activeStoriesCount = stories.filter(s => s.isActive).length;
        if (isActive) {
            if (editingId) {
                const currentStory = stories.find(s => s.id === editingId);
                if (currentStory && !currentStory.isActive && activeStoriesCount >= 6) {
                    return toast.error("Cannot save: Maximum 6 active stories allowed. Deactivate one first.");
                }
            } else {
                if (activeStoriesCount >= 6) {
                    return toast.error("Cannot create: Maximum 6 active stories allowed. Deactivate one first or save as inactive.");
                }
            }
        }

        setLoading(true);

        try {
            const selectedProduct = products.find(p => p.id === productId);
            const price = selectedProduct ? (selectedProduct.finalPrice ?? selectedProduct.price) : null;

            const payload = {
                title,
                videoFile: videoType === "FILE" ? videoFile : null,
                videoUrl: videoType === "URL" ? videoUrl : null,
                thumbnailImage,
                productId: productId || null,
                price,
                isActive,
            };

            if (editingId) {
                const res = await updateStory(editingId, payload);
                if (res.success && res.story) {
                    toast.success("Story updated");
                    // We can just rely on router.refresh() or fetch latest state
                    router.refresh();
                    resetForm();
                } else {
                    toast.error(res.error || "Failed");
                }
            } else {
                const res = await createStory({ ...payload, displayOrder: stories.length });
                if (res.success && res.story) {
                    toast.success("Story created");
                    router.refresh();
                    resetForm();
                } else {
                    toast.error(res.error || "Failed");
                }
            }
        } catch (error) {
            toast.error("Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        if (!currentStatus) { // User is trying to activate an inactive story
            const activeStoriesCount = stories.filter(s => s.isActive).length;
            if (activeStoriesCount >= 6) {
                return toast.error("Maximum 6 stories can be active. Please deactivate one first.");
            }
        }

        const res = await toggleStoryStatus(id, !currentStatus);
        if (res.success) {
            setStories(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
            toast.success(`Story ${!currentStatus ? 'activated' : 'deactivated'}`);
            router.refresh();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const res = await deleteStory(id);
        if (res.success) {
            setStories(prev => prev.filter(s => s.id !== id));
            toast.success("Story deleted");
            router.refresh();
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = stories.findIndex(s => s.id === active.id);
        const newIndex = stories.findIndex(s => s.id === over.id);
        const reordered = arrayMove(stories, oldIndex, newIndex);
        setStories(reordered);

        const res = await reorderStories(reordered.map(s => s.id));
        if (!res.success) toast.error('Reorder failed');
        else router.refresh();
    };

    return (
        <div className="space-y-8">
            {/* Action Bar */}
            {!isFormOpen && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-stone-200">
                    <div>
                        <p className="text-sm font-medium text-stone-600">
                            Total Stories: {stories.length} (Max 6 visible on frontend)
                        </p>
                    </div>
                    <Button onClick={() => setIsFormOpen(true)} className="bg-[#1C1917] hover:bg-stone-800 text-white flex items-center gap-2">
                        <Plus size={16} /> Add Story
                    </Button>
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold tracking-tight text-[#1C1917]">{editingId ? "Edit Story" : "New Story"}</h2>
                        <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title & Product */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Linked Product (Optional)</Label>
                                <select
                                    value={productId}
                                    onChange={handleProductSelect}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C1917]"
                                >
                                    <option value="">-- No Product Selected --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (₹{p.finalPrice || p.price})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Story Title *</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter story title"
                                    required
                                />
                            </div>
                        </div>

                        {/* Video type & Media */}
                        <div className="space-y-4 pt-4 border-t border-stone-100">
                            <Label>Video Source *</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={videoType === "FILE"}
                                        onChange={() => setVideoType("FILE")}
                                        className="text-[#1C1917] focus:ring-[#1C1917]"
                                    />
                                    <span>Upload File</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={videoType === "URL"}
                                        onChange={() => setVideoType("URL")}
                                        className="text-[#1C1917] focus:ring-[#1C1917]"
                                    />
                                    <span>External URL (YouTube/Vimeo etc)</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {/* Video Upload/Input */}
                                <div className="space-y-2">
                                    <Label>{videoType === "FILE" ? "Upload Video File" : "Video URL"} *</Label>
                                    {videoType === "URL" ? (
                                        <Input
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder="https://youtube.com/..."
                                        />
                                    ) : (
                                        <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center h-[200px] flex flex-col justify-center">
                                            {videoFile ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                                                        <Video size={20} /> Video Ready
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setVideoFile("")}>
                                                        Change Video
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                                                    <span className="text-sm text-stone-600 block">Click to upload video</span>
                                                    <span className="text-xs text-stone-400 mt-1 block">MP4/WebM, Max 50MB</span>
                                                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="space-y-2">
                                    <Label>Thumbnail Image *</Label>
                                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center h-[200px] flex flex-col justify-center">
                                        {thumbnailImage ? (
                                            <div className="space-y-3">
                                                <Image src={thumbnailImage} alt="Thumbnail" width={80} height={120} className="max-h-[100px] mx-auto rounded object-cover" />
                                                <Button type="button" variant="outline" size="sm" onClick={() => setThumbnailImage("")}>
                                                    Change Thumbnail
                                                </Button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                                                <span className="text-sm text-stone-600 block">Portrait thumbnail</span>
                                                <span className="text-xs text-stone-400 mt-1 block">JPG/PNG/WebP, Max 5MB</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Checkbox */}
                        <div className="flex items-center gap-2 pt-4">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="rounded text-[#1C1917] focus:ring-[#1C1917]"
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Active (Show on homepage)</Label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 pb-2">
                            <Button type="submit" className="bg-[#1C1917] hover:bg-stone-800" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Save Changes" : "Create Story"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Story List — Drag & Drop */}
            {!isFormOpen && stories.length > 0 && (
                <div className="space-y-2">
                    {/* Tip */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> Drag and drop stories to reorder them. The order will be reflected on your homepage.
                        </p>
                    </div>

                    <DndContext
                        id="stories-dnd"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={stories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {stories.map((story) => (
                                    <SortableStoryRow
                                        key={story.id}
                                        story={story}
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
        </div>
    );
}
