"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "@/app/admin/products/actions";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteProduct(productId);
            router.refresh();
        } catch (error) {
            alert("Failed to delete product");
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
