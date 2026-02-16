import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/returns/pipeline
 * Returns return requests grouped by pipeline stage
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Define pipeline stages mapped to DB statuses
        const stages = [
            { key: "REQUESTED", label: "Requested", statuses: ["REQUESTED"] },
            { key: "APPROVED", label: "Approved", statuses: ["APPROVED"] },
            { key: "ITEM_RECEIVED", label: "Item Received", statuses: ["ITEM_RECEIVED"] },
            { key: "INSPECTION", label: "Inspection", statuses: ["ITEM_RECEIVED"] }, // inspection pending
            { key: "REFUND_PROCESSING", label: "Refund Processing", statuses: ["REFUND_PENDING"] },
            { key: "CLOSED", label: "Closed", statuses: ["REFUND_COMPLETED", "REJECTED", "CLOSED"] },
        ];

        // Fetch all non-closed returns with full details
        const allReturns = await prisma.returnRequest.findMany({
            include: {
                user: {
                    select: { name: true, email: true, phone: true },
                },
                order: {
                    select: { total: true, customerName: true },
                },
                items: {
                    include: {
                        orderItem: {
                            include: {
                                product: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { requestedAt: "desc" },
        });

        // Group returns into pipeline stages
        const pipeline = stages.map((stage) => {
            let stageReturns;

            if (stage.key === "INSPECTION") {
                // Returns in inspection = ITEM_RECEIVED with inspectionStatus PENDING
                stageReturns = allReturns.filter(
                    (r) =>
                        r.status === "ITEM_RECEIVED" &&
                        r.inspectionStatus === "PENDING"
                );
            } else if (stage.key === "ITEM_RECEIVED") {
                // Received but NOT in inspection (inspectionStatus is NOT_APPLICABLE or already passed/failed)
                stageReturns = allReturns.filter(
                    (r) =>
                        r.status === "ITEM_RECEIVED" &&
                        r.inspectionStatus !== "PENDING" &&
                        r.inspectionStatus !== "PASSED" &&
                        r.inspectionStatus !== "FAILED"
                );
            } else {
                stageReturns = allReturns.filter((r) => stage.statuses.includes(r.status));
            }

            return {
                ...stage,
                returns: stageReturns.map((r) => ({
                    id: r.id,
                    orderId: r.orderId,
                    status: r.status,
                    inspectionStatus: r.inspectionStatus,
                    reason: r.reason,
                    requestedAt: r.requestedAt,
                    approvedAt: r.approvedAt,
                    receivedAt: r.receivedAt,
                    refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
                    customerName: r.order?.customerName || r.user?.name || "Unknown",
                    customerEmail: r.user?.email,
                    orderTotal: r.order ? Number(r.order.total) : 0,
                    adminNotes: r.adminNotes,
                    productNames: r.items
                        .map((item) => item.orderItem?.product?.name)
                        .filter(Boolean)
                        .join(", "),
                    itemCount: r.items.length,
                })),
                count: stageReturns.length,
            };
        });

        // Overall stats
        const stats = {
            total: allReturns.length,
            pendingAction: allReturns.filter((r) =>
                ["REQUESTED", "APPROVED", "ITEM_RECEIVED"].includes(r.status)
            ).length,
            avgResolutionTime: 0, // Could calculate if needed
        };

        return NextResponse.json({ pipeline, stats });
    } catch (error) {
        console.error("Error fetching return pipeline:", error);
        return NextResponse.json(
            { error: "Failed to fetch return pipeline" },
            { status: 500 }
        );
    }
}
