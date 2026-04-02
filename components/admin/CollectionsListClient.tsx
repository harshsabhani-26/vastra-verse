"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, FolderTree, Layers, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { createMainCategory, toggleMainCategoryActive, updateMainCategoryMobileImage, updateMainCategoryName, getMainCategoryDeletePreview, cascadeDeleteMainCategory } from "@/app/admin/categories/main-category-actions";
import { getSubCategoryDeletePreview, cascadeDeleteSubCategory } from "@/app/admin/categories/actions";
import { AlertTriangle } from "lucide-react";
import { Loader2, Upload } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    icon: string | null;
    isFeatured: boolean;
    isActive: boolean;
    displayOrder: number;
    _count?: {
        products: number;
    };
}

interface MainCategory {
    id: string;
    name: string;
    href: string;
    mobileImage?: string | null;
    isActive: boolean;
}

interface CollectionsListClientProps {
    initialCategories: Category[];
    initialMainCategories: MainCategory[];
}

function SortableCategory({ category, onDelete, onToggleActive, onToggleFeatured }: {
    category: Category;
    onDelete: (id: string, name: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onToggleFeatured: (id: string, isFeatured: boolean) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border border-stone-200 rounded-lg p-4 ${isDragging ? 'shadow-lg' : ''}`}
        >
            <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Image */}
                <div className="h-14 w-14 bg-stone-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    {category.image ? (
                        <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-stone-300" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900">{category.name}</h3>
                        {category.isFeatured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm font-medium rounded">
                                Featured
                            </span>
                        )}
                        {!category.isActive && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-medium rounded">
                                Inactive
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">/{category.slug}</p>
                    {category.description && (
                        <p className="text-sm text-stone-600 truncate mt-1">{category.description}</p>
                    )}
                    <p className="text-sm text-stone-400 mt-1">
                        {category._count?.products || 0} products
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFeatured(category.id, !category.isFeatured)}
                        title={category.isFeatured ? "Remove from featured" : "Add to featured"}
                        className={category.isFeatured ? "text-amber-600" : "text-stone-400"}
                    >
                        ⭐
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(category.id, !category.isActive)}
                        title={category.isActive ? "Deactivate" : "Activate"}
                    >
                        {category.isActive ? (
                            <Eye className="h-6 w-6 text-green-600" />
                        ) : (
                            <EyeOff className="h-6 w-6 text-red-600" />
                        )}
                    </Button>
                    <Link href={`/admin/categories/edit/${category.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-600">
                            <Edit2 className="h-6 w-6" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => onDelete(category.id, category.name)}
                    >
                        <Trash2 className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Warning Modal ───────────────────────────────────────────────────
interface DeletePreview {
    subCategories: { id: string; name: string; productCount: number }[];
    totalProducts: number;
    totalStories: number;
}

function DeleteWarningModal({
    categoryName,
    preview,
    isDeleting,
    onClose,
    onConfirm,
}: {
    categoryName: string;
    preview: DeletePreview | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const hasConnected = preview && (
        preview.subCategories.length > 0 ||
        preview.totalProducts > 0 ||
        preview.totalStories > 0
    );

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
                    <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-red-800">Delete &ldquo;{categoryName}&rdquo;?</h2>
                        <p className="text-xs text-red-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="ml-auto p-1.5 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {preview === null ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                            <span className="ml-2 text-sm text-stone-500">Checking connected data…</span>
                        </div>
                    ) : hasConnected ? (
                        <>
                            <p className="text-sm text-stone-700">
                                Deleting this main category will <strong className="text-red-700">permanently remove</strong> all connected data:
                            </p>
                            <div className="rounded-xl border border-red-200 bg-red-50 divide-y divide-red-100 overflow-hidden">
                                {preview.subCategories.length > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FolderTree className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-800">Sub-Categories</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-700">{preview.subCategories.length}</span>
                                    </div>
                                )}
                                {preview.totalProducts > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-800">Products</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-700">{preview.totalProducts}</span>
                                    </div>
                                )}
                                {preview.totalStories > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-800">Stories</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-700">{preview.totalStories}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-stone-400">
                                ⚠️ Order history is preserved. Only active product listings, wishlists, cart items, and stories will be removed.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-stone-600">
                            No sub-categories, products, or stories are connected to this main category. It is safe to delete.
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 px-6 pb-5">
                    <Button variant="outline" onClick={onClose} disabled={isDeleting} className="rounded-lg">
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting || preview === null}
                        className="rounded-lg bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting…</>
                        ) : (
                            <><Trash2 className="h-4 w-4 mr-1.5" /> Yes, Delete Everything</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Category Modal ─────────────────────────────────────────────────────
function EditCategoryModal({
    category,
    onClose,
    onConfirm,
}: {
    category: MainCategory;
    onClose: () => void;
    onConfirm: (id: string, name: string, imageFile: File | null) => void;
}) {
    const [name, setName] = useState(category.name);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(category.mobileImage ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImageFile(file);
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(category.id, name.trim(), imageFile);
    };

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <h2 className="text-lg font-bold text-stone-900">Edit Category</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Category Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-stone-700">
                            Category name: <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Saree, Kurtis, Fabrics…"
                            className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder:text-stone-300 text-sm transition"
                        />
                    </div>

                    {/* Mobile View Image */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-stone-700">
                            Mobile View IMG
                        </label>
                        <p className="text-xs text-stone-400">
                            This image appears inside the circular nav icon on the mobile home screen.
                        </p>

                        <div
                            className="relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/30 cursor-pointer transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <Image
                                        src={imagePreview}
                                        alt="Mobile image preview"
                                        fill
                                        className="object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-black/40 hidden group-hover:flex items-center justify-center">
                                        <Upload className="h-6 w-6 text-white" />
                                        <span className="text-white text-xs ml-2">Change image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-amber-500 transition-colors">
                                    <div className="h-12 w-12 rounded-full bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm font-medium">Click to upload image</span>
                                    <span className="text-xs text-stone-300">PNG, JPG, WEBP — square recommended</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        {imagePreview && (
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-stone-400">Nav circle preview:</span>
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-stone-200 shadow relative">
                                    <Image
                                        src={imagePreview}
                                        alt="Nav circle preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="bg-primary hover:bg-primary/90 rounded-lg"
                        >
                            <Edit2 className="h-4 w-4 mr-1.5" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Add Category Modal ──────────────────────────────────────────────────────
function AddCategoryModal({
    onClose,
    onConfirm,
}: {
    onClose: () => void;
    onConfirm: (name: string, imageFile: File | null) => void;
}) {
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImageFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(name.trim(), imageFile);
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdrop}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <h2 className="text-lg font-bold text-stone-900">Add New Category</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Category Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-stone-700">
                            Enter new main category name: <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Saree, Kurtis, Fabrics…"
                            className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder:text-stone-300 text-sm transition"
                        />
                    </div>

                    {/* Mobile View Image */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-stone-700">
                            Add Mobile View IMG
                        </label>
                        <p className="text-xs text-stone-400">
                            This image will appear inside the circular nav icon on the mobile home screen.
                        </p>

                        <div
                            className="relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/30 cursor-pointer transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <Image
                                        src={imagePreview}
                                        alt="Mobile image preview"
                                        fill
                                        className="object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-black/40 hidden group-hover:flex items-center justify-center">
                                        <Upload className="h-6 w-6 text-white" />
                                        <span className="text-white text-xs ml-2">Change image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-amber-500 transition-colors">
                                    <div className="h-12 w-12 rounded-full bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm font-medium">Click to upload image</span>
                                    <span className="text-xs text-stone-300">PNG, JPG, WEBP — square recommended</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* Preview of how it looks in the nav circle */}
                        {imagePreview && (
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-stone-400">Nav circle preview:</span>
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-stone-200 shadow relative">
                                    <Image
                                        src={imagePreview}
                                        alt="Nav circle preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="bg-primary hover:bg-primary/90 rounded-lg"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Category
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CollectionsListClient({ initialCategories, initialMainCategories }: CollectionsListClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"category" | "sub-category">("category");
    const [mainCategories, setMainCategories] = useState<MainCategory[]>(initialMainCategories || []);
    const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
    // Main category delete state
    const [deletePending, setDeletePending] = useState<{ id: string; name: string } | null>(null);
    const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Sub-category delete state
    const [subDeletePending, setSubDeletePending] = useState<{ id: string; name: string } | null>(null);
    const [subDeletePreview, setSubDeletePreview] = useState<DeletePreview | null>(null);
    const [isSubDeleting, setIsSubDeleting] = useState(false);

    useEffect(() => {
        setMainCategories(initialMainCategories || []);
    }, [initialMainCategories]);

    const handleEditMainCategory = async (id: string, name: string, imageFile: File | null) => {
        setEditingCategory(null);

        // Optimistic name update
        setMainCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));

        const nameRes = await updateMainCategoryName(id, name);
        if (!nameRes.success) {
            alert("Failed to update name: " + nameRes.error);
            setMainCategories(prev => prev.map(c => c.id === id ? { ...c, name: c.name } : c));
            return;
        }

        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("folder", "categories");
            try {
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    const imgRes = await updateMainCategoryMobileImage(id, uploadData.url);
                    if (imgRes.success && imgRes.data) {
                        setMainCategories(prev => prev.map(c => c.id === id ? imgRes.data as MainCategory : c));
                    }
                }
            } catch {
                // image upload failed silently
            }
        }
    };

    const handleAddMainCategory = async (name: string, imageFile: File | null) => {
        setIsCreating(true);
        const tempId = Date.now().toString();

        // Optimistic update
        setMainCategories(prev => [
            ...prev,
            { id: tempId, name, href: "", isActive: true, mobileImage: null }
        ]);
        setShowAddModal(false);

        const res = await createMainCategory(name);

        if (res.success && res.data) {
            const newId: string = (res.data as MainCategory).id;

            // Upload mobile image if provided
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                formData.append("folder", "categories");

                try {
                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });
                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        const imgRes = await updateMainCategoryMobileImage(newId, uploadData.url);
                        if (imgRes.success && imgRes.data) {
                            setMainCategories(prev =>
                                prev.map(c => c.id === tempId ? imgRes.data as MainCategory : c)
                            );
                            setIsCreating(false);
                            return;
                        }
                    }
                } catch {
                    // image upload failed silently — category still created
                }
            }

            setMainCategories(prev =>
                prev.map(c => c.id === tempId ? res.data as MainCategory : c)
            );
        } else {
            alert("Failed to create main category: " + res.error);
            setMainCategories(prev => prev.filter(c => c.id !== tempId));
        }

        setIsCreating(false);
    };

    const handleToggleMainCategoryActive = async (id: string, currentStatus: boolean) => {
        // Optimistic toggle
        setMainCategories(mainCategories.map(cat =>
            cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        ));

        const res = await toggleMainCategoryActive(id, !currentStatus);
        if (!res.success) {
            // Revert
            setMainCategories(mainCategories.map(cat =>
                cat.id === id ? { ...cat, isActive: currentStatus } : cat
            ));
            alert("Failed to toggle status: " + res.error);
        }
    };

    const handleDeleteMainCategory = async (id: string, name: string) => {
        // Open warning modal and start fetching preview in background
        setDeletePending({ id, name });
        setDeletePreview(null);
        const res = await getMainCategoryDeletePreview(name);
        if (res.success && res.data) {
            setDeletePreview(res.data as DeletePreview);
        } else {
            // If preview fails still allow delete with empty preview
            setDeletePreview({ subCategories: [], totalProducts: 0, totalStories: 0 });
        }
    };

    const handleConfirmCascadeDelete = async () => {
        if (!deletePending) return;
        setIsDeleting(true);
        const { id, name } = deletePending;
        const backup = [...mainCategories];
        setMainCategories(prev => prev.filter(c => c.id !== id));

        const res = await cascadeDeleteMainCategory(id, name);
        if (!res.success) {
            setMainCategories(backup);
            alert("Failed to delete: " + res.error);
        }
        setIsDeleting(false);
        setDeletePending(null);
        setDeletePreview(null);
    };

    const handleUploadMobileImage = async (id: string, file: File) => {
        setUploadingImageId(id);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "categories");

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const res = await updateMainCategoryMobileImage(id, data.url);
                if (res.success && res.data) {
                    setMainCategories(prev => prev.map(c => c.id === id ? res.data as MainCategory : c));
                } else {
                    alert("Failed to save mobile image: " + res.error);
                }
            } else {
                const data = await response.json();
                alert(`Failed to upload image: ${data.details || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert("Failed to upload image. Please check your network connection.");
        } finally {
            setUploadingImageId(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex((cat) => cat.id === active.id);
            const newIndex = categories.findIndex((cat) => cat.id === over.id);

            const reorderedCategories = arrayMove(categories, oldIndex, newIndex);

            // Update display order
            const updatedCategories = reorderedCategories.map((cat, index) => ({
                ...cat,
                displayOrder: index
            }));

            setCategories(updatedCategories);
            setIsSaving(true);

            // Save to server
            try {
                await fetch("/api/categories/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        categories: updatedCategories.map((cat, index) => ({
                            id: cat.id,
                            displayOrder: index
                        }))
                    })
                });
            } catch (error) {
                console.error("Failed to save order:", error);
                alert("Failed to save new order");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        setSubDeletePending({ id, name });
        setSubDeletePreview(null);
        const res = await getSubCategoryDeletePreview(id);
        if (res.success && res.data) {
            setSubDeletePreview(res.data as DeletePreview);
        } else {
            setSubDeletePreview({ subCategories: [], totalProducts: 0, totalStories: 0 });
        }
    };

    const handleConfirmSubCascadeDelete = async () => {
        if (!subDeletePending) return;
        setIsSubDeleting(true);
        const { id } = subDeletePending;
        const backup = [...categories];
        setCategories(prev => prev.filter(c => c.id !== id));

        const res = await cascadeDeleteSubCategory(id);
        if (!res.success) {
            setCategories(backup);
            alert("Failed to delete: " + (res as any).error);
        }
        setIsSubDeleting(false);
        setSubDeletePending(null);
        setSubDeletePreview(null);
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive })
            });

            if (response.ok) {
                setCategories(categories.map(cat =>
                    cat.id === id ? { ...cat, isActive } : cat
                ));
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFeatured })
            });

            if (response.ok) {
                setCategories(categories.map(cat =>
                    cat.id === id ? { ...cat, isFeatured } : cat
                ));
            }
        } catch (error) {
            alert("Failed to update featured status");
        }
    };

    return (
        <>
            {/* ─── Sub-Category Delete Warning Modal ─── */}
            {subDeletePending && (
                <DeleteWarningModal
                    categoryName={subDeletePending.name}
                    preview={subDeletePreview}
                    isDeleting={isSubDeleting}
                    onClose={() => {
                        if (!isSubDeleting) {
                            setSubDeletePending(null);
                            setSubDeletePreview(null);
                        }
                    }}
                    onConfirm={handleConfirmSubCascadeDelete}
                />
            )}

            {/* ─── Main Category Delete Warning Modal ─── */}
            {deletePending && (
                <DeleteWarningModal
                    categoryName={deletePending.name}
                    preview={deletePreview}
                    isDeleting={isDeleting}
                    onClose={() => {
                        if (!isDeleting) {
                            setDeletePending(null);
                            setDeletePreview(null);
                        }
                    }}
                    onConfirm={handleConfirmCascadeDelete}
                />
            )}

            {/* ─── Edit Category Modal ─── */}
            {editingCategory && (
                <EditCategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onConfirm={handleEditMainCategory}
                />
            )}

            {/* ─── Add Category Modal ─── */}
            {showAddModal && (
                <AddCategoryModal
                    onClose={() => setShowAddModal(false)}
                    onConfirm={handleAddMainCategory}
                />
            )}

            <div className="space-y-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Categories &amp; Sub-Categories</h1>
                    <p className="text-sm text-stone-500 mt-1">Manage your store's categories and sub-categories.</p>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-stone-200">
                        <button
                            onClick={() => setActiveTab("category")}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "category"
                                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                                }`}
                        >
                            <FolderTree size={16} />
                            Category
                        </button>
                        <button
                            onClick={() => setActiveTab("sub-category")}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "sub-category"
                                ? "border-amber-500 text-amber-700 bg-amber-50/50"
                                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                                }`}
                        >
                            <Layers size={16} />
                            Sub-Category
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === "category" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#1C1917]">Main Categories</h2>
                                        <p className="text-sm text-stone-500 mt-1">
                                            These are the main navigation categories linked from your store header.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowAddModal(true)}
                                        disabled={isCreating}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        Add Category
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mainCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:border-amber-200 transition-colors gap-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0 relative overflow-hidden group">
                                                        {category.mobileImage ? (
                                                            <>
                                                                <Image src={category.mobileImage} alt={category.name} fill className="object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer" onClick={() => document.getElementById(`mobile-image-${category.id}`)?.click()}>
                                                                    {uploadingImageId === category.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => document.getElementById(`mobile-image-${category.id}`)?.click()}>
                                                                {uploadingImageId === category.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderTree className="h-5 w-5" />}
                                                            </div>
                                                        )}
                                                        <input
                                                            id={`mobile-image-${category.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            disabled={uploadingImageId === category.id}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadMobileImage(category.id, file);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-stone-900 block">{category.name}</span>
                                                        <span className="text-xs text-stone-400">Mobile Img: {category.mobileImage ? 'Yes' : 'No'}</span>
                                                    </div>
                                                </div>
                                                {category.isActive ? (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-semibold tracking-wider rounded uppercase">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-semibold tracking-wider rounded uppercase">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    onClick={() => handleToggleMainCategoryActive(category.id, category.isActive)}
                                                    title={category.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {category.isActive ? (
                                                        <Eye className="h-4 w-4 text-green-600 mr-1" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-red-600 mr-1" />
                                                    )}
                                                    <span className="text-xs">{category.isActive ? "Deactivate" : "Activate"}</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => setEditingCategory(category)}
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteMainCategory(category.id, category.name)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    <span className="text-xs">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "sub-category" && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#1C1917]">Sub-Categories</h2>
                                        <p className="text-sm text-stone-500 mt-1">
                                            {categories.length} {categories.length === 1 ? 'sub-category' : 'sub-categories'}
                                            {isSaving && " • Saving order..."}
                                        </p>
                                    </div>
                                    <Link href="/admin/categories/add">
                                        <Button className="bg-primary hover:bg-primary/90">
                                            <Plus className="mr-2 h-4 w-4" /> Add Sub-Category
                                        </Button>
                                    </Link>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-base text-blue-800">
                                        💡 <strong>Tip:</strong> Drag and drop sub-categories to reorder them. The order will be reflected on your website.
                                    </p>
                                </div>

                                {/* Collections List */}
                                <DndContext
                                    id="categories-dnd"
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={categories.map(cat => cat.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {categories.length === 0 ? (
                                                <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
                                                    <ImageIcon className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                                                    <p className="text-sm text-stone-500">No sub-categories yet</p>
                                                    <p className="text-sm text-stone-400 mt-1">Create your first sub-category to get started</p>
                                                </div>
                                            ) : (
                                                categories.map((category) => (
                                                    <SortableCategory
                                                        key={category.id}
                                                        category={category}
                                                        onDelete={handleDelete}
                                                        onToggleActive={handleToggleActive}
                                                        onToggleFeatured={handleToggleFeatured}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
