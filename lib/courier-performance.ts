/**
 * Courier Performance Service
 * 
 * Tracks and scores courier performance based on:
 * - Average delivery time
 * - Success rate (delivered / total)
 * - RTO rate
 * 
 * Used for intelligent courier recommendation during shipment creation
 */

import prisma from "@/lib/prisma";

interface CourierMetrics {
    courierName: string;
    totalShipments: number;
    delivered: number;
    rto: number;
    avgDeliveryDays: number;
    successRate: number;
    rtoRate: number;
    score: number; // Composite score 0-100
}

/**
 * Calculate performance metrics for all active couriers
 */
export async function getCourierPerformance(options?: {
    startDate?: Date;
    endDate?: Date;
    minShipments?: number;
}): Promise<CourierMetrics[]> {
    const {
        startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
        endDate = new Date(),
        minShipments = 5 // Minimum shipments to be considered
    } = options || {};

    // Fetch all shipments with courier data
    const shipments = await prisma.shipment.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            courierName: {
                not: null
            },
            status: {
                notIn: ["PENDING", "CANCELLED", "FAILED"]
            }
        },
        select: {
            courierName: true,
            status: true,
            shippedAt: true,
            deliveredAt: true,
            createdAt: true
        }
    });

    // Group by courier
    const courierMap = new Map<string, {
        total: number;
        delivered: number;
        rto: number;
        totalDeliveryDays: number;
        deliveryCount: number;
    }>();

    shipments.forEach(s => {
        const courier = s.courierName!;
        if (!courierMap.has(courier)) {
            courierMap.set(courier, {
                total: 0,
                delivered: 0,
                rto: 0,
                totalDeliveryDays: 0,
                deliveryCount: 0
            });
        }

        const stats = courierMap.get(courier)!;
        stats.total++;

        if (s.status === "DELIVERED") {
            stats.delivered++;

            // Calculate delivery time
            if (s.shippedAt && s.deliveredAt) {
                const diffTime = Math.abs(s.deliveredAt.getTime() - s.shippedAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                stats.totalDeliveryDays += diffDays;
                stats.deliveryCount++;
            }
        } else if (s.status === "RETURN_DELIVERED" || s.status === "RETURN_INITIATED") {
            stats.rto++;
        }
    });

    // Calculate metrics and scores
    const metrics: CourierMetrics[] = [];

    courierMap.forEach((stats, courierName) => {
        // Skip if insufficient data
        if (stats.total < minShipments) {
            return;
        }

        const successRate = stats.delivered / stats.total;
        const rtoRate = stats.rto / stats.total;
        const avgDeliveryDays = stats.deliveryCount > 0
            ? stats.totalDeliveryDays / stats.deliveryCount
            : 0;

        // Calculate composite score (0-100)
        // Weight: 50% success rate, 30% delivery speed, 20% low RTO
        const successScore = successRate * 50;
        const speedScore = Math.max(0, 30 - (avgDeliveryDays * 5)); // Penalty for slow delivery
        const rtoScore = Math.max(0, 20 - (rtoRate * 100)); // Penalty for high RTO

        const score = Math.min(100, Math.max(0, successScore + speedScore + rtoScore));

        metrics.push({
            courierName,
            totalShipments: stats.total,
            delivered: stats.delivered,
            rto: stats.rto,
            avgDeliveryDays: Number(avgDeliveryDays.toFixed(1)),
            successRate: Number((successRate * 100).toFixed(1)),
            rtoRate: Number((rtoRate * 100).toFixed(1)),
            score: Number(score.toFixed(1))
        });
    });

    // Sort by score (best first)
    return metrics.sort((a, b) => b.score - a.score);
}

/**
 * Get recommended courier for a specific pincode
 * Returns top-ranked courier by performance score
 */
export async function getRecommendedCourier(pincode?: string): Promise<string | null> {
    // For now, we'll use global performance
    // In a production system, you'd filter by pincode serviceability
    const performance = await getCourierPerformance();

    if (performance.length === 0) {
        return null;
    }

    // Return best courier name
    return performance[0].courierName;
}

/**
 * Get courier score by name
 */
export async function getCourierScore(courierName: string): Promise<number> {
    const performance = await getCourierPerformance();
    const courier = performance.find(c => c.courierName === courierName);
    return courier?.score || 0;
}
