import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Pure data access layer for category queries
 * 
 * RULES:
 * - NO "use server" directive
 * - NO admin imports
 * - Read-only operations only
 * - Uses next/cache for request deduplication across requests
 */

export interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
}

export const getCategories = unstable_cache(
    async (): Promise<Category[]> => {
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
    },
    ['categories-list'],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ['categories']
    }
);
