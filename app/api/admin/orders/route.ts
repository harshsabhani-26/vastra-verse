import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
    try {
        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

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

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        const serializedOrders = orders.map(order => ({
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
                price: item.price.toString(),
                product: {
                    ...item.product,
                    price: item.product.price.toString()
                }
            }))
        }));

        return NextResponse.json({
            orders: serializedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            }
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
