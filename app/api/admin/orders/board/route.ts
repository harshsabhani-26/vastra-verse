import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/board
 * Returns orders grouped by status for Kanban board
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const statuses = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

        // Parallel queries for each status column
        const [columns, counts] = await Promise.all([
            Promise.all(
                statuses.map((status) =>
                    prisma.order.findMany({
                        where: {
                            status,
                            // Only show paid/COD orders
                            OR: [
                                { paymentStatus: "PAID" },
                                { paymentStatus: "REFUNDED" },
                                { AND: [{ paymentStatus: "PENDING" }, { paymentMethod: "COD" }] },
                            ],
                        },
                        select: {
                            id: true,
                            customerName: true,
                            total: true,
                            status: true,
                            paymentMethod: true,
                            paymentStatus: true,
                            createdAt: true,
                            updatedAt: true,
                            trackingNumber: true,
                            items: {
                                select: { quantity: true },
                            },
                            user: {
                                select: { name: true, email: true },
                            },
                        },
                        orderBy: { createdAt: "desc" },
                        take: 30, // Cap per column
                    })
                )
            ),
            Promise.all(
                statuses.map((status) =>
                    prisma.order.count({
                        where: {
                            status,
                            OR: [
                                { paymentStatus: "PAID" },
                                { paymentStatus: "REFUNDED" },
                                { AND: [{ paymentStatus: "PENDING" }, { paymentMethod: "COD" }] },
                            ],
                        },
                    })
                )
            ),
        ]);

        const board = statuses.map((status, i) => ({
            status,
            orders: columns[i].map((o) => ({
                ...o,
                total: Number(o.total),
                itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
            })),
            total: counts[i],
        }));

        return NextResponse.json({ board });
    } catch (error) {
        console.error("Error fetching board data:", error);
        return NextResponse.json({ error: "Failed to fetch board data" }, { status: 500 });
    }
}
