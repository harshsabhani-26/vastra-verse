"use server";

import prisma from "@/lib/prisma";

export interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
}

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                displayOrder: 'asc',
            },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
            },
        });
        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}
