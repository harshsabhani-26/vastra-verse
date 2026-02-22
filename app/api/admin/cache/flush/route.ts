/**
 * Admin Cache Flush API
 * 
 * POST /api/admin/cache/flush
 * 
 * Provides an admin-only endpoint to flush all caches.
 * Useful after:
 * - Direct DB modifications (Prisma Studio, SQL)
 * - Database migrations
 * - Emergency cache corruption recovery
 * 
 * Security: Requires authenticated admin session.
 */

import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { revalidateAll, ALL_CACHE_TAGS, CACHE_TAGS } from "@/lib/cache/cache-tags";
import {
    revalidateProducts,
    revalidateCategories,
    revalidateBanners,
    revalidateStories,
    revalidateSocials,
    revalidateOrders,
    revalidateNotifications,
    revalidateSettings,
} from "@/lib/cache/cache-tags";

// POST /api/admin/cache/flush — Flush specific or all caches
export async function POST(req: Request) {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const body = await req.json().catch(() => ({}));
        const { tags } = body as { tags?: string[] };

        if (tags && tags.length > 0) {
            // Selective flush — only specified tags
            const revalidators: Record<string, () => Promise<void>> = {
                [CACHE_TAGS.PRODUCTS]: revalidateProducts,
                [CACHE_TAGS.CATEGORIES]: revalidateCategories,
                [CACHE_TAGS.BANNERS]: revalidateBanners,
                [CACHE_TAGS.STORIES]: revalidateStories,
                [CACHE_TAGS.SOCIALS]: revalidateSocials,
                [CACHE_TAGS.ORDERS]: revalidateOrders,
                [CACHE_TAGS.NOTIFICATIONS]: revalidateNotifications,
                [CACHE_TAGS.SETTINGS]: revalidateSettings,
            };

            const flushed: string[] = [];
            for (const tag of tags) {
                const revalidator = revalidators[tag];
                if (revalidator) {
                    await revalidator();
                    flushed.push(tag);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Flushed ${flushed.length} cache tag(s)`,
                flushed,
            });
        } else {
            // Nuclear flush — everything
            await revalidateAll();

            return NextResponse.json({
                success: true,
                message: "All caches flushed successfully",
                flushed: ALL_CACHE_TAGS,
            });
        }
    } catch (error) {
        console.error("[CACHE_FLUSH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// GET /api/admin/cache/flush — Show available tags (for admin UI)
export async function GET() {
    try {
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        return NextResponse.json({
            availableTags: ALL_CACHE_TAGS,
            usage: {
                flushAll: "POST /api/admin/cache/flush (empty body)",
                flushSpecific: 'POST /api/admin/cache/flush { "tags": ["products", "categories"] }',
            },
        });
    } catch (error) {
        console.error("[CACHE_FLUSH_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
