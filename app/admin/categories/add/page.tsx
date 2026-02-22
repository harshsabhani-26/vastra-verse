import CategoryForm from "@/components/admin/CategoryForm";
import prisma from "@/lib/prisma";

export default async function AddCategoryPage() {
    const mainCategories = await prisma.mainCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
    });

    return <CategoryForm mode="add" mainCategories={mainCategories} />;
}
