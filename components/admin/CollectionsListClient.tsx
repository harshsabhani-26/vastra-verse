"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, FolderTree, Layers } from "lucide-react";
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
import { createMainCategory, toggleMainCategoryActive, deleteMainCategory } from "@/app/admin/categories/main-category-actions";

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

export default function CollectionsListClient({ initialCategories, initialMainCategories }: CollectionsListClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"category" | "sub-category">("category");
    const [mainCategories, setMainCategories] = useState<MainCategory[]>(initialMainCategories || []);

    useEffect(() => {
        setMainCategories(initialMainCategories || []);
    }, [initialMainCategories]);

    const handleAddMainCategory = async () => {
        const name = window.prompt("Enter new main category name:");
        if (name && name.trim()) {
            const tempId = Date.now().toString();
            // Optimistic update
            setMainCategories([
                ...mainCategories,
                { id: tempId, name: name.trim(), href: "", isActive: true }
            ]);

            const res = await createMainCategory(name.trim());
            if (res.success && res.data) {
                setMainCategories(prev => prev.map(c => c.id === tempId ? res.data : c));
            } else {
                alert("Failed to create main category: " + res.error);
                // Revert
                setMainCategories(prev => prev.filter(c => c.id !== tempId));
            }
        }
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
        if (window.confirm(`Delete main category "${name}"?`)) {
            // Revert info
            const backup = [...mainCategories];
            setMainCategories(mainCategories.filter(cat => cat.id !== id));

            const res = await deleteMainCategory(id);
            if (!res.success) {
                setMainCategories(backup);
                alert("Failed to delete category: " + res.error);
            }
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
        if (!confirm(`Delete category "${name}"? This will not delete the products.`)) return;

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setCategories(categories.filter(cat => cat.id !== id));
                router.refresh();
            } else {
                const error = await response.text();
                alert(`Failed to delete: ${error}`);
            }
        } catch (error) {
            alert("Failed to delete collection");
        }
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
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Categories & Sub-Categories</h1>
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
                                <Button onClick={handleAddMainCategory} className="bg-primary hover:bg-primary/90">
                                    <Plus className="mr-2 h-4 w-4" /> Add Category
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
                                                <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                                                    <FolderTree className="h-5 w-5" />
                                                </div>
                                                <span className="font-semibold text-stone-900">{category.name}</span>
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
    );
}
