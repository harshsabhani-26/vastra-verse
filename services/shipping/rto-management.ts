/**
 * RTO Management Service
 * 
 * Handles Return-to-Origin logistics:
 * - Track RTO shipments
 * - Calculate financial losses
 * - Generate RTO analytics
 */

import prisma from "@/lib/prisma";

interface RTOAnalytics {
    totalRTO: number;
    rtoRate: number;
    totalLoss: number;
    avgReturnTime: number;
    topReasons: Array<{ reason: string; count: number }>;
}

/**
 * Mark a shipment as RTO and calculate financial impact
 */
export async function handleRTOShipment(shipmentId: string, reason?: string): Promise<void> {
    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { order: true }
    });

    if (!shipment) {
        throw new Error("Shipment not found");
    }

    // Calculate total loss
    const forwardCost = Number(shipment.shippingCost || 0);
    const rtoCost = Number(shipment.rtoCost || 0);
    const codFee = Number(shipment.codCollectionFee || 0);
    const totalLoss = forwardCost + rtoCost + codFee;

    // Update shipment
    await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
            status: "RETURN_INITIATED",
            returnInitiatedAt: new Date(),
            rtoCost: rtoCost > 0 ? rtoCost : forwardCost, // Assume RTO = forward cost if not set
            profitImpact: -totalLoss, // Negative profit
            failureReason: reason
        }
    });

    // Update order status
    await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
            status: "RETURNED"
        }
    });

    // Timeline entry
    await prisma.orderTimeline.create({
        data: {
            orderId: shipment.orderId,
            event: "RTO_INITIATED",
            details: `Shipment marked as RTO. Reason: ${reason || "Unknown"}. Financial loss: ₹${totalLoss.toFixed(2)}`,
            createdBy: "SYSTEM"
        }
    });
}

/**
 * Get RTO analytics for a date range
 */
export async function getRTOAnalytics(startDate?: Date, endDate?: Date): Promise<RTOAnalytics> {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate || new Date();

    // Get all shipments in period
    const allShipments = await prisma.shipment.findMany({
        where: {
            createdAt: { gte: start, lte: end },
            isReturn: false
        }
    });

    // Get RTO shipments
    const rtoShipments = await prisma.shipment.findMany({
        where: {
            createdAt: { gte: start, lte: end },
            status: {
                in: ["RETURN_INITIATED", "RETURN_PICKED", "RETURN_DELIVERED"]
            },
            isReturn: false
        },
        select: {
            shippingCost: true,
            rtoCost: true,
            codCollectionFee: true,
            shippedAt: true,
            returnInitiatedAt: true,
            failureReason: true
        }
    });

    const totalRTO = rtoShipments.length;
    const rtoRate = allShipments.length > 0 ? (totalRTO / allShipments.length) * 100 : 0;

    // Calculate total loss
    let totalLoss = 0;
    let totalReturnDays = 0;
    let returnTimeCount = 0;

    rtoShipments.forEach(s => {
        const loss = Number(s.shippingCost || 0) + Number(s.rtoCost || 0) + Number(s.codCollectionFee || 0);
        totalLoss += loss;

        if (s.shippedAt && s.returnInitiatedAt) {
            const diff = s.returnInitiatedAt.getTime() - s.shippedAt.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            totalReturnDays += days;
            returnTimeCount++;
        }
    });

    const avgReturnTime = returnTimeCount > 0 ? totalReturnDays / returnTimeCount : 0;

    // Top reasons
    const reasonMap = new Map<string, number>();
    rtoShipments.forEach(s => {
        const reason = s.failureReason || "Unknown";
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    const topReasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalRTO,
        rtoRate: parseFloat(rtoRate.toFixed(2)),
        totalLoss: parseFloat(totalLoss.toFixed(2)),
        avgReturnTime: parseFloat(avgReturnTime.toFixed(1)),
        topReasons
    };
}
