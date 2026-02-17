import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getCourierPerformance } from "@/lib/courier-performance";

export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : new Date(new Date().setMonth(new Date().getMonth() - 1)); // Default last 30 days
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : new Date();

        // 1. Overview Metrics
        const shipments = await prisma.shipment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    not: "CANCELLED"
                }
            },
            select: {
                status: true,
                courierName: true,
                shippingCost: true,
                rtoCost: true,
                shippedAt: true,
                deliveredAt: true,
                codRemittance: true
            }
        });

        const totalShipments = shipments.length;
        if (totalShipments === 0) {
            return NextResponse.json({
                overview: {
                    totalShipments: 0,
                    delivered: 0,
                    rto: 0,
                    avgDeliveryDays: 0,
                    totalCost: 0
                },
                courierPerformance: []
            });
        }

        const deliveredShipments = shipments.filter(s => s.status === "DELIVERED");
        const rtoShipments = shipments.filter(s => s.status === "RETURN_DELIVERED" || s.status === "RETURN_INITIATED");

        // Calculate Avg Delivery Time
        let totalDeliveryDays = 0;
        deliveredShipments.forEach(s => {
            if (s.shippedAt && s.deliveredAt) {
                const diffTime = Math.abs(s.deliveredAt.getTime() - s.shippedAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDeliveryDays += diffDays;
            }
        });
        const avgDeliveryDays = deliveredShipments.length > 0
            ? (totalDeliveryDays / deliveredShipments.length).toFixed(1)
            : 0;

        // Calculate Cost
        const totalShippingCost = shipments.reduce((sum, s) => sum + Number(s.shippingCost || 0), 0);
        const totalRtoCost = shipments.reduce((sum, s) => sum + Number(s.rtoCost || 0), 0);

        // 2. Get Courier Performance from service
        const courierPerformance = await getCourierPerformance({
            startDate,
            endDate,
            minShipments: 3
        });

        return NextResponse.json({
            overview: {
                totalShipments,
                delivered: deliveredShipments.length,
                rto: rtoShipments.length,
                rtoRate: ((rtoShipments.length / totalShipments) * 100).toFixed(1),
                avgDeliveryDays,
                totalCost: totalShippingCost + totalRtoCost
            },
            courierPerformance: courierPerformance.map(c => ({
                name: c.courierName,
                score: c.score,
                successRate: c.successRate,
                rtoRate: c.rtoRate,
                avgDeliveryDays: c.avgDeliveryDays,
                totalShipments: c.totalShipments
            }))
        });

    } catch (error) {
        console.error("[Analytics] Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
