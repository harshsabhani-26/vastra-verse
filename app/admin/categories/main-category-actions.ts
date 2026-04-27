"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMainCategory(name: string) {
    try {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        // FIX 5: clean URL — was /shop?category=${slug}
        const href = `/shop/${slug}`;
        const cat = await prisma.mainCategory.create({ data: { name, href } });
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleMainCategoryActive(id: string, isActive: boolean) {
    try {
        const cat = await prisma.mainCategory.update({ where: { id }, data: { isActive } });
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateMainCategoryMobileImage(id: string, mobileImage: string) {
    try {
        const cat = await prisma.mainCategory.update({ where: { id }, data: { mobileImage } });
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateMainCategoryName(id: string, name: string) {
    try {
        const cat = await prisma.mainCategory.update({ where: { id }, data: { name } });
        revalidatePath("/", "layout");
        return { success: true, data: cat };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMainCategory(id: string) {
    try {
        await prisma.mainCategory.delete({ where: { id } });
        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/** Preview what will be deleted — used to show a warning modal before cascade delete */
export async function getMainCategoryDeletePreview(name: string) {
    try {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        // Match sub-categories whose slug starts with "mainSlug/" (e.g. "saree/embrodery-saree")
        // Also match exact slug or exact name as fallback
        const subCategories = await prisma.category.findMany({
            where: {
                OR: [
                    { slug: { startsWith: `${slug}/` } },
                    { slug: { equals: slug, mode: "insensitive" } },
                    { name: { equals: name, mode: "insensitive" } },
                ]
            },
            include: { _count: { select: { products: true } } }
        });

        const subCategoryIds = subCategories.map(c => c.id);
        const totalProducts = subCategories.reduce((sum, c) => sum + c._count.products, 0);

        let totalStories = 0;
        if (subCategoryIds.length > 0) {
            totalStories = await prisma.story.count({
                where: { product: { categoryId: { in: subCategoryIds } } }
            });
        }

        return {
            success: true,
            data: {
                subCategories: subCategories.map(c => ({ id: c.id, name: c.name, productCount: c._count.products })),
                totalProducts,
                totalStories,
            }
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/** Full cascade delete: Stories → Products (wishlist/cart cascade) → Sub-categories → MainCategory */
export async function cascadeDeleteMainCategory(id: string, name: string) {
    try {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        // Match sub-categories by slug prefix (e.g. all slugs starting with "saree/")
        // plus exact slug and exact name fallbacks
        const subCategories = await prisma.category.findMany({
            where: {
                OR: [
                    { slug: { startsWith: `${slug}/` } },
                    { slug: { equals: slug, mode: "insensitive" } },
                    { name: { equals: name, mode: "insensitive" } },
                ]
            },
        });

        const subCategoryIds = subCategories.map(c => c.id);

        if (subCategoryIds.length > 0) {
            const products = await prisma.product.findMany({
                where: { categoryId: { in: subCategoryIds } },
                select: { id: true }
            });
            const productIds = products.map(p => p.id);

            if (productIds.length > 0) {
                // 1. Stories linked to those products
                await prisma.story.deleteMany({ where: { productId: { in: productIds } } });
                // 2. Wishlist items
                await prisma.wishlist.deleteMany({ where: { productId: { in: productIds } } });
                // 3. Cart items
                await prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } });
                // 4. Product images
                await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
                // 5. Products (OrderItem rows kept for order history)
                await prisma.product.deleteMany({ where: { id: { in: productIds } } });
            }

            // 6. Sub-categories
            await prisma.category.deleteMany({ where: { id: { in: subCategoryIds } } });
        }

        // 7. Main category
        await prisma.mainCategory.delete({ where: { id } });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
