import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const category = await prisma.category.findUnique({
        where: { id }
    });

    if (!category) {
        notFound();
    }

    // Add placeholder fields for the form
    const categoryWithFields = {
        ...category,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        icon: category.icon || null,
        isFeatured: category.isFeatured || false,
        isActive: category.isActive ?? true,
    };

    const mainCategories = await prisma.mainCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
    });

    return <CategoryForm category={categoryWithFields} mode="edit" mainCategories={mainCategories} />;
}
