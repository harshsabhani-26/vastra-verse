import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import { schedulePickup, cancelShipment } from "@/lib/shipping-provider";
import { updateShipmentStatus, findShipmentByAwb } from "@/lib/shipment-service";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/admin/shipments/[id]
 * Update shipment (schedule pickup, cancel, etc)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        const shipment = await prisma.shipment.findUnique({
            where: { id },
            include: { order: true }
        });

        if (!shipment) {
            return NextResponse.json(
                { error: "Shipment not found" },
                { status: 404 }
            );
        }

        switch (action) {
            case "SCHEDULE_PICKUP": {
                if (!shipment.providerShipmentId) {
                    return NextResponse.json(
                        { error: "Provider shipment ID not found" },
                        { status: 400 }
                    );
                }

                const pickupResponse = await schedulePickup(
                    parseInt(shipment.providerShipmentId)
                );

                await updateShipmentStatus(
                    id,
                    "PICKUP_SCHEDULED",
                    {
                        pickupScheduledAt: new Date(pickupResponse.pickup_scheduled_date)
                    },
                    `Pickup scheduled for ${pickupResponse.pickup_scheduled_date}`
                );

                return NextResponse.json({
                    success: true,
                    message: "Pickup scheduled successfully",
                    pickupDate: pickupResponse.pickup_scheduled_date
                });
            }

            case "CANCEL": {
                if (!shipment.awbNumber) {
                    return NextResponse.json(
                        { error: "Cannot cancel shipment without AWB" },
                        { status: 400 }
                    );
                }

                if (["DELIVERED", "CANCELLED", "RETURN_DELIVERED"].includes(shipment.status)) {
                    return NextResponse.json(
                        { error: "Cannot cancel shipment in current status" },
                        { status: 400 }
                    );
                }

                const { reason } = body;

                await cancelShipment([shipment.awbNumber]);

                await updateShipmentStatus(
                    id,
                    "CANCELLED",
                    {
                        cancelledAt: new Date(),
                        cancellationReason: reason || "Cancelled by admin"
                    },
                    `Shipment cancelled: ${reason || "Admin request"}`
                );

                // Revert order status
                await prisma.order.update({
                    where: { id: shipment.orderId },
                    data: {
                        status: "CONFIRMED",
                        trackingNumber: null
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: "Shipment cancelled successfully"
                });
            }

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

    } catch (error: any) {
        console.error("[Admin] Shipment update error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update shipment" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/shipments/[id]
 * Get shipment details
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const shipment = await prisma.shipment.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!shipment) {
            return NextResponse.json(
                { error: "Shipment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ shipment });

    } catch (error: any) {
        console.error("[Admin] Get shipment error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch shipment" },
            { status: 500 }
        );
    }
}
