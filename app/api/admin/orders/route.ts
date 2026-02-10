import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { logAdminFetch } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);

        // Cursor-based pagination (FASTER than skip/take)
        const cursor = searchParams.get("cursor");
        const PAGE_SIZE = 20;

        // Filters
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build where clause
        const where: any = {};

        if (status && status !== "all") {
            where.status = status;
        }

        // Default to last 90 days if no date range specified
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 90);

        where.createdAt = {
            gte: startDate ? new Date(startDate) : defaultStartDate,
        };

        if (endDate) {
            where.createdAt.lte = new Date(endDate);
        }

        // Fetch PAGE_SIZE + 1 to determine if there's a next page
        const orders = await prisma.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                total: true,
                subtotal: true,
                cgst: true,
                sgst: true,
                igst: true,
                shippingCharges: true,
                gstRate: true,
                discount: true,
                giftWrapCharge: true,
                paymentStatus: true,
                paymentMethod: true,
                customerName: true,
                customerPhone: true,
                shippingAddress: true,
                trackingNumber: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: {
                                    where: { type: 'MAIN' },
                                    take: 1,
                                    select: { url: true }
                                }
                            }
                        }
                    }
                }
            },
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1, // Skip the cursor itself
            }),
            take: PAGE_SIZE + 1,
            orderBy: { createdAt: 'desc' },
        });

        // Check if there are more results
        const hasNextPage = orders.length > PAGE_SIZE;
        const data = hasNextPage ? orders.slice(0, -1) : orders;

        // Get total count for backwards compatibility (optional, can be removed if not needed)
        const total = await prisma.order.count({ where });

        const serializedOrders = data.map(order => ({
            ...order,
            total: order.total.toString(),
            subtotal: order.subtotal?.toString() || "0",
            cgst: order.cgst?.toString() || "0",
            sgst: order.sgst?.toString() || "0",
            igst: order.igst?.toString() || "0",
            shippingCharges: order.shippingCharges?.toString() || "0",
            gstRate: order.gstRate?.toString() || "18",
            discount: order.discount?.toString() || "0",
            giftWrapCharge: order.giftWrapCharge?.toString() || "0",
            items: order.items.map(item => ({
                ...item,
                price: item.price?.toString() ?? "0",
                product: item.product ? {
                    ...item.product,
                    price: item.product.price?.toString() ?? "0"
                } : { id: "", name: "(deleted)", price: "0", images: [] }
            }))
        }));

        return NextResponse.json({
            orders: serializedOrders,
            nextCursor: hasNextPage ? data[data.length - 1].id : null,
            hasNextPage,
            total, // For display purposes
        });
    } catch (error) {
        logAdminFetch("ORDERS_GET", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
