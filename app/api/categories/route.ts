import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { invalidateCategories } from "@/lib/cache-invalidation";

// Utility function to generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export async function GET() {
    try {
        const categories = await cache.getOrSet(
            CACHE_KEYS.CATEGORIES_ALL,
            async () => {
                return prisma.category.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                    },
                    orderBy: { name: 'asc' }
                });
            },
            CACHE_TTL.CATEGORIES
        );

        return NextResponse.json(
            categories,
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                }
            }
        );
    } catch (error) {
        console.error("[CATEGORIES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST create new category
export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Admin role check
        if (session.user?.role !== "ADMIN") {
            console.log("[CATEGORIES_POST] Unauthorized access attempt:", session.user);
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, image } = body;

        const category = await prisma.category.create({
            data: {
                name,
                description,
                image,
                slug: generateSlug(name)
            }
        });

        // Invalidate category cache after creation
        await invalidateCategories();

        return NextResponse.json(category);
    } catch (error: any) {
        console.error("[CATEGORIES_POST]", error);

        if (error.code === 'P2002') {
            return new NextResponse("Name already exists", { status: 400 });
        }

        return new NextResponse("Internal Error", { status: 500 });
    }
}
