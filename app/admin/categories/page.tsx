import prisma from "@/lib/prisma";
import CollectionsListClient from "@/components/admin/CollectionsListClient";

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            image: true,
        },
        orderBy: { name: 'asc' }
    });

    // Add placeholder fields for the client component
    const categoriesWithPlaceholders = categories.map(cat => ({
        ...cat,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        icon: null,
        isFeatured: false,
        isActive: true,
        displayOrder: 0,
        _count: { products: 0 }
    }));

    return <CollectionsListClient initialCategories={categoriesWithPlaceholders} />;
}
