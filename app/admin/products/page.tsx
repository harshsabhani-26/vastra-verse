import prisma from "@/lib/prisma";
import ProductsListClient from "@/components/admin/ProductsListClient";

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        include: {
            category: true,
            images: {
                orderBy: { position: 'asc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    });

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

    return <ProductsListClient initialProducts={serializedProducts} />;
}
