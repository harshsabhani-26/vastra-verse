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
    // URL format: /shop/saree/embroidery-saree
    // Category slug already contains "/" (e.g. "saree/embroidery-saree")
    // which becomes a natural clean path segment
    let categoryPages: MetadataRoute.Sitemap = [];
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
            orderBy: { displayOrder: "asc" },
        });

        categoryPages = categories.map((cat) => ({
            // FIX: was /shop?category=... — now clean path /shop/saree/embroidery-saree
            url: `${BASE_URL}/shop/${cat.slug}`,
            lastModified: cat.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        // DB unavailable during static generation — skip categories
    }

    // ── Products ────────────────────────────────────────────────────────────
    // URL format: /shop/saree/embroidery-saree/product-slug
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const products = await prisma.product.findMany({
            // FIX: was status: "ACTIVE" — real values in DB are "PUBLISHED"
            where: {
                status: "PUBLISHED",
                slug: { not: null },
                stock: { gt: 0 },
            },
            select: {
                slug: true,
                updatedAt: true,
                category: {
                    select: { slug: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        productPages = products
            .filter((p) => p.slug && p.category?.slug)
            .map((product) => ({
                // FIX: was /shop/${product.id} — now /shop/saree/embroidery-saree/product-slug
                url: `${BASE_URL}/shop/${product.category.slug}/${product.slug}`,
                lastModified: product.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));
    } catch {
        // DB unavailable during static generation — skip products
    }

    return [...staticPages, ...categoryPages, ...productPages];
}
