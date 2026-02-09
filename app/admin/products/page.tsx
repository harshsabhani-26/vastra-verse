import prisma from "@/lib/prisma";
import ProductsListClient from "@/components/admin/ProductsListClient";

interface SearchParams {
    page?: string;
    search?: string;
    status?: string;
    category?: string;
}

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const params = await searchParams || {};
    const page = parseInt(params.page || "1");
    const limit = 20;
    const skip = (page - 1) * limit;
    const searchQuery = params.search || "";
    const statusFilter = params.status || "all";
    const categoryFilter = params.category || "all";

    // Build where clause
    const where: any = {};

    if (searchQuery) {
        where.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { sku: { contains: searchQuery, mode: 'insensitive' } },
        ];
    }

    if (statusFilter !== "all") {
        where.status = statusFilter;
    }

    if (categoryFilter !== "all") {
        where.categoryId = categoryFilter;
    }

    // Fetch products with pagination
    const [products, total, categories] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock: true,
                status: true,
                createdAt: true,
                lowStockThreshold: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                images: {
                    orderBy: { position: 'asc' },
                    take: 1,
                    select: {
                        id: true,
                        url: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.product.count({ where }),
        prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    // Serialize the data for client component
    const serializedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        stock: product.stock,
        status: product.status,
        createdAt: product.createdAt,
        lowStockThreshold: product.lowStockThreshold,
        category: {
            id: product.category.id,
            name: product.category.name
        },
        images: product.images.map(img => ({
            id: img.id,
            url: img.url
        }))
    }));

    const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };

    return (
        <ProductsListClient
            initialProducts={serializedProducts}
            pagination={pagination}
            categories={categories}
            initialFilters={{
                search: searchQuery,
                status: statusFilter,
                category: categoryFilter,
            }}
        />
    );
}
