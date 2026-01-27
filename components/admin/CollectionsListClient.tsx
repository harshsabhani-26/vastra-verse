"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
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

interface CollectionsListClientProps {
    initialCategories: Category[];
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
                <div className="h-16 w-16 bg-stone-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    {category.image ? (
                        <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-stone-300" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900">{category.name}</h3>
                        {category.isFeatured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                Featured
                            </span>
                        )}
                        {!category.isActive && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Inactive
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">/{category.slug}</p>
                    {category.description && (
                        <p className="text-sm text-stone-600 truncate mt-1">{category.description}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">
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
                        size="sm"
                        onClick={() => onToggleActive(category.id, !category.isActive)}
                        title={category.isActive ? "Deactivate" : "Activate"}
                    >
                        {category.isActive ? (
                            <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                            <EyeOff className="h-4 w-4 text-red-600" />
                        )}
                    </Button>
                    <Link href={`/admin/categories/edit/${category.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => onDelete(category.id, category.name)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CollectionsListClient({ initialCategories }: CollectionsListClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [isSaving, setIsSaving] = useState(false);

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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-[#1C1917]">Categories</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                        {isSaving && " • Saving order..."}
                    </p>
                </div>
                <Link href="/admin/categories/add">
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </Link>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Drag and drop categories to reorder them. The order will be reflected on your website.
                </p>
            </div>

            {/* Collections List */}
            <DndContext
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
                                <p className="text-stone-500">No categories yet</p>
                                <p className="text-sm text-stone-400 mt-1">Create your first category to get started</p>
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
    );
}
