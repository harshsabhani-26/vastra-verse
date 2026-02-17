import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { validateCursor, validateLimit } from "@/lib/api-utils";
import { withQueryLogging } from "@/lib/query-logger";
import { checkUserRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/admin/products - Cursor-based paginated product list
 * 
 * Query params:
 * - cursor: Product ID to start from (optional)
 * - limit: Number of items per page (default: 20, max: 100)
 * - status: Filter by product status
 * - search: Search by name or SKU
 */
export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult; // Returns 401 if not authenticated OR 429 if rate limited
        }

        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(req.url);

        // Cursor-based pagination
        const cursor = validateCursor(searchParams.get("cursor"));
        const limit = validateLimit(searchParams.get("limit"), 20, 100);

        // Filters
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: any = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch products with cursor pagination
        const products = await withQueryLogging(
            '/api/admin/products',
            'findMany',
            () => prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    stock: true,
                    lowStockThreshold: true,
                    price: true,
                    status: true,
                    createdAt: true,
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" }  // Tiebreaker for stable sorting
                ],
                ...(cursor ? {
                    cursor: { id: cursor },
                    skip: 1  // Skip the cursor item itself
                } : {}),
                take: limit + 1  // Fetch +1 to check if there's a next page
            }),
            { cursor, limit, status, search }
        );

        // Check if there are more results
        const hasNextPage = products.length > limit;
        const items = hasNextPage ? products.slice(0, limit) : products;
        const nextCursor = hasNextPage ? items[items.length - 1].id : null;

        // Convert Decimal to number for JSON serialization
        const productsWithNumbers = items.map(product => ({
            ...product,
            price: Number(product.price),
        }));

        return NextResponse.json({
            items: productsWithNumbers,
            nextCursor,
            hasNextPage
        });
    } catch (error) {
        console.error('[ERROR] /api/admin/products - Failed to fetch products:', error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
