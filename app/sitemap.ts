import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// Revalidate every 6 hours so newly added products appear in sitemap
export const revalidate = 21600;

const BASE_URL = "https://vastraaverse.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // ── Static pages ────────────────────────────────────────────────────────
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/shop`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/collections`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    // ── Categories ──────────────────────────────────────────────────────────
    let categoryPages: MetadataRoute.Sitemap = [];
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
            orderBy: { displayOrder: "asc" },
        });

        categoryPages = categories.map((cat) => ({
            url: `${BASE_URL}/shop?category=${encodeURIComponent(cat.slug)}`,
            lastModified: cat.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        // DB unavailable during static generation — skip categories
    }

    // ── Products ────────────────────────────────────────────────────────────
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const products = await prisma.product.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
        });

        productPages = products.map((product) => ({
            url: `${BASE_URL}/shop/${product.id}`,
            lastModified: product.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
    } catch {
        // DB unavailable during static generation — skip products
    }

    return [...staticPages, ...categoryPages, ...productPages];
}
