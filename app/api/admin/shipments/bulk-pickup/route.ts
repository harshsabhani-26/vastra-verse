import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { schedulePickup } from "@/lib/shiprocket/shipment";
import prisma from "@/lib/prisma";

/**
 * POST /api/admin/shipments/bulk-pickup
 *
 * Admin-only: Schedule a Shiprocket pickup for multiple ready shipments.
 * Calls the Shiprocket /courier/generate/pickup API with the shipment IDs,
 * then updates all selected shipments to PICKUP_SCHEDULED status.
 *
 * Body: { shipmentIds: string[], pickupDate?: "YYYY-MM-DD" }
 */
export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const rateLimitResult = await checkUserRateLimit(req, "admin");
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { shipmentIds } = body;

        if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json(
                { error: "No shipment IDs provided" },
                { status: 400 }
            );
        }

        if (shipmentIds.length > 100) {
            return NextResponse.json(
                { error: "Maximum 100 shipments per batch" },
                { status: 400 }
            );
        }

        // Only pick up shipments that are ready (have AWB, correct status)
        const shipments = await prisma.shipment.findMany({
            where: {
                id: { in: shipmentIds },
                status: { in: ["READY_TO_SHIP", "LABEL_GENERATED"] },
                shiprocketOrderId: { not: null },
            },
            select: { id: true, shiprocketOrderId: true, orderId: true },
        });

        if (shipments.length === 0) {
            return NextResponse.json(
                { error: "No eligible shipments found (must be READY_TO_SHIP or LABEL_GENERATED with Shiprocket ID)" },
                { status: 400 }
            );
        }

        // Build numeric shipment IDs for Shiprocket API
        const numericIds = shipments
            .map((s) => parseInt(s.shiprocketOrderId || "", 10))
            .filter((id) => !isNaN(id));

        if (numericIds.length === 0) {
            return NextResponse.json(
                { error: "No valid Shiprocket shipment IDs found" },
                { status: 400 }
            );
        }

        // Schedule pickup via Shiprocket API
        const pickupResponse = await schedulePickup({
            shipment_id: numericIds,
        });

        // Update all eligible shipments in DB
        const eligibleIds = shipments.map((s) => s.id);
        const scheduledDate = pickupResponse.response?.pickup_scheduled_date || new Date().toISOString().split("T")[0];

        const result = await prisma.shipment.updateMany({
            where: {
                id: { in: eligibleIds },
            },
            data: {
                status: "PICKUP_SCHEDULED",
                pickupScheduledAt: new Date(scheduledDate),
            },
        });

        // Add timeline events for each shipment
        try {
            await prisma.orderTimeline.createMany({
                data: shipments.map((s) => ({
                    orderId: s.orderId,
                    event: "PICKUP_SCHEDULED",
                    details: `Bulk pickup scheduled (Token: ${pickupResponse.response?.pickup_token_number || "N/A"}) for ${scheduledDate}`,
                    createdBy: "ADMIN",
                })),
                skipDuplicates: true,
            });
        } catch (timelineErr) {
            console.warn("[Bulk Pickup] Failed to create timeline events:", timelineErr);
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            pickupToken: pickupResponse.response?.pickup_token_number,
            pickupDate: scheduledDate,
            message: `Pickup scheduled for ${result.count} shipment(s)`,
        });
    } catch (error: any) {
        console.error("[Bulk Pickup API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to schedule pickup" },
            { status: 500 }
        );
    }
}
