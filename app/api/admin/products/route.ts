import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { safePage, safePageSize } from "@/lib/api-utils";
import { logAdminFetch } from "@/lib/logger";

// GET /api/admin/products - Get all products for inventory management
export async function GET(req: NextRequest) {
    try {
        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(req.url);

        // Pagination
        const page = safePage(searchParams.get("page"));
        const limit = safePageSize(searchParams.get("limit"), 100);
        const skip = (page - 1) * limit;

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

        // Fetch products with pagination
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    stock: true,
                    lowStockThreshold: true,
                    price: true,
                    status: true,
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        // Convert Decimal to number for JSON serialization
        const productsWithNumbers = products.map(product => ({
            ...product,
            price: Number(product.price),
        }));

        return NextResponse.json({
            products: productsWithNumbers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            }
        });
    } catch (error) {
        logAdminFetch("PRODUCTS_GET", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
