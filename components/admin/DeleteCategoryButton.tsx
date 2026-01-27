"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";
import { useRouter } from "next/navigation";

export function DeleteCategoryButton({
    categoryId,
    categoryName,
    productsCount
}: {
    categoryId: string;
    categoryName: string;
    productsCount: number;
}) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (productsCount > 0) {
            alert(`Cannot delete "${categoryName}" because it has ${productsCount} products. Please reassign or delete the products first.`);
            return;
        }

        if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteCategory(categoryId);
            router.refresh();
        } catch (error: any) {
            alert(error.message || "Failed to delete category");
            setIsDeleting(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
            disabled={isDeleting}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
