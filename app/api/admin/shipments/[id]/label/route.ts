import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { generateLabel } from "@/lib/shiprocket/shipment";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/shipments/[id]/label
 *
 * Admin-only: Generate or download the shipping label for a shipment.
 *
 * - Looks up the shipment by DB id and retrieves its Shiprocket shipment ID
 * - Calls Shiprocket POST /courier/generate/label
 * - Saves the label URL to DB and updates status → LABEL_GENERATED
 * - Returns { labelUrl }
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Rate limiting
        const rateLimitResult = await checkUserRateLimit(req, "admin");
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch shipment from DB
        const shipment = await prisma.shipment.findUnique({
            where: { id },
        });

        if (!shipment) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        // If label already exists in DB, return it directly
        if (shipment.labelUrl) {
            return NextResponse.json({
                success: true,
                labelUrl: shipment.labelUrl,
                awb: shipment.awbNumber,
                fromCache: true,
            });
        }

        // Need a Shiprocket order ID to generate label
        const shiprocketId = shipment.shiprocketOrderId;
        if (!shiprocketId) {
            return NextResponse.json(
                { error: "Shipment does not have a Shiprocket ID. Create the shipment first." },
                { status: 400 }
            );
        }

        const numericId = parseInt(shiprocketId, 10);
        if (isNaN(numericId)) {
            return NextResponse.json(
                { error: "Invalid Shiprocket shipment ID" },
                { status: 400 }
            );
        }

        // Call Shiprocket label API
        const labelResponse = await generateLabel(numericId);

        const labelUrl = labelResponse.label_url || null;

        // Save label URL to DB and advance status
        await prisma.shipment.update({
            where: { id },
            data: {
                labelUrl: labelUrl || undefined,
                status: "LABEL_GENERATED",
            },
        });

        // Add timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: shipment.orderId,
                event: "LABEL_GENERATED",
                details: `Shipping label generated for AWB: ${shipment.awbNumber || shiprocketId}`,
                createdBy: session.user.email || "ADMIN",
            },
        });

        if (labelUrl) {
            return NextResponse.json({
                success: true,
                labelUrl,
                awb: shipment.awbNumber,
                fromCache: false,
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: "Label generated but no URL returned by Shiprocket. Check Shiprocket dashboard.",
                awb: shipment.awbNumber,
            },
            { status: 202 }
        );
    } catch (error: any) {
        console.error("[Label API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate label" },
            { status: 500 }
        );
    }
}
