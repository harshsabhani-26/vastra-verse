import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Pure data access layer for product queries
 * 
 * RULES:
 * - NO "use server" directive
 * - NO admin imports
 * - Read-only operations only
 * - Uses next/cache for request deduplication across requests
 */

export const getNewArrivals = unstable_cache(
    async () => {
        try {
            const products = await prisma.product.findMany({
                where: {
                    isNewArrival: true,
                    status: "PUBLISHED"
                },
                take: 4,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    discount: true,
                    finalPrice: true,
                    isNewArrival: true,
                    images: {
                        where: { type: 'MAIN' },
                        take: 1,
                        select: {
                            url: true,
                            alt: true,
                        }
                    },
                    category: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc' // Most recent first
                }
            });
            return products;
        } catch (error) {
            console.error("Failed to fetch new arrivals:", error);
            return [];
        }
    },
    ['new-arrivals'],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ['products', 'new-arrivals']
    }
);

export const getBestSellers = unstable_cache(
    async () => {
        try {
            const products = await prisma.product.findMany({
                where: {
                    isBestSeller: true,
                    status: "PUBLISHED"
                },
                take: 4,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    discount: true,
                    finalPrice: true,
                    isNewArrival: true,
                    images: {
                        where: { type: 'MAIN' },
                        take: 1,
                        select: {
                            url: true,
                            alt: true,
                        }
                    },
                    category: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });
            return products;
        } catch (error) {
            console.error("Failed to fetch best sellers:", error);
            return [];
        }
    },
    ['best-sellers'],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ['products', 'best-sellers']
    }
);
