import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ndr
 *
 * Admin-only: List NDR events with pagination and action status filter.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
        const actionStatus = searchParams.get("actionStatus");
        const search = searchParams.get("search")?.trim();

        const where: any = {};

        if (actionStatus === "pending") {
            where.actionTaken = null;
        } else if (actionStatus === "resolved") {
            where.NOT = { actionTaken: null };
        }

        if (search) {
            where.awbNumber = { contains: search, mode: "insensitive" };
        }

        const [events, totalCount] = await Promise.all([
            prisma.ndrEvent.findMany({
                where,
                include: {
                    shipment: {
                        select: {
                            orderId: true,
                            courierName: true,
                            status: true,
                            order: {
                                select: {
                                    customerName: true,
                                    customerPhone: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.ndrEvent.count({ where }),
        ]);

        const serializedEvents = events.map((e) => ({
            id: e.id,
            shipmentId: e.shipmentId,
            awbNumber: e.awbNumber,
            ndrCode: e.ndrCode,
            ndrReason: e.ndrReason,
            attemptDate: e.attemptDate.toISOString(),
            actionTaken: e.actionTaken,
            actionDate: e.actionDate?.toISOString() || null,
            adminNotes: e.adminNotes,
            resolvedAt: e.resolvedAt?.toISOString() || null,
            createdAt: e.createdAt.toISOString(),
            shipment: {
                orderId: e.shipment.orderId,
                courierName: e.shipment.courierName,
                status: e.shipment.status,
                order: {
                    customerName: e.shipment.order.customerName,
                    customerPhone: e.shipment.order.customerPhone,
                },
            },
        }));

        return NextResponse.json({
            events: serializedEvents,
            totalCount,
        });
    } catch (error: any) {
        console.error("[Admin NDR API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch NDR events" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/ndr
 *
 * Admin-only: Resolve an NDR event with action and notes.
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, actionTaken, adminNotes } = body;

        if (!id || !actionTaken) {
            return NextResponse.json(
                { error: "Missing required fields: id, actionTaken" },
                { status: 400 }
            );
        }

        const validActions = ["RE_ATTEMPT", "RTO", "ADDRESS_UPDATE", "CALL_CUSTOMER", "CANCEL"];
        if (!validActions.includes(actionTaken)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
                { status: 400 }
            );
        }

        const updated = await prisma.ndrEvent.update({
            where: { id },
            data: {
                actionTaken,
                actionDate: new Date(),
                adminNotes: adminNotes || null,
                resolvedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            event: {
                id: updated.id,
                actionTaken: updated.actionTaken,
                resolvedAt: updated.resolvedAt?.toISOString(),
            },
        });
    } catch (error: any) {
        console.error("[Admin NDR API] Error:", error);
        return NextResponse.json(
            { error: "Failed to resolve NDR event" },
            { status: 500 }
        );
    }
}
