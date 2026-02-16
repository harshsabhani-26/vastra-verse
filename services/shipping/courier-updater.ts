/**
 * Courier Performance Updater Service
 * 
 * Designed to be run periodically (e.g., daily cron) to:
 * - Calculate performance metrics for each courier
 * - Update CourierPerformance table with fresh data
 * - Enable data-driven courier selection
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
    score: number;
}

/**
 * Calculate and update courier performance for all active couriers
 */
export async function updateCourierPerformanceMetrics(options?: {
    lookbackDays?: number; // How many days to analyze
}): Promise<{ updated: number; created: number }> {
    const lookbackDays = options?.lookbackDays || 30;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    console.log(`[CourierPerformance] Calculating metrics since ${since.toISOString()}`);

    // Fetch all shipments with courier data
    const shipments = await prisma.shipment.findMany({
        where: {
            createdAt: {
                gte: since
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

    // Calculate metrics and update database
    let updated = 0;
    let created = 0;

    for (const [courierName, stats] of courierMap.entries()) {
        // Skip if insufficient data
        if (stats.total < 5) {
            console.log(`[CourierPerformance] Skipping ${courierName}: insufficient data (${stats.total} shipments)`);
            continue;
        }

        const successRate = stats.delivered / stats.total;
        const rtoRate = stats.rto / stats.total;
        const avgDeliveryDays = stats.deliveryCount > 0
            ? stats.totalDeliveryDays / stats.deliveryCount
            : 0;

        // Calculate composite score (0-100)
        // Weight: 50% success rate, 30% delivery speed, 20% low RTO
        const successScore = successRate * 50;
        const speedScore = Math.max(0, 30 - (avgDeliveryDays * 3)); // Faster = better
        const rtoScore = Math.max(0, 20 - (rtoRate * 100)); // Lower RTO = better

        const score = Math.min(100, Math.max(0, successScore + speedScore + rtoScore));

        // Upsert to database
        const existing = await prisma.courierPerformance.findUnique({
            where: { courierName }
        });

        await prisma.courierPerformance.upsert({
            where: { courierName },
            create: {
                courierName,
                avgDeliveryTime: avgDeliveryDays,
                successRate: successRate * 100, // Store as percentage
                rtoRate: rtoRate * 100,
                score,
                totalShipments: stats.total,
                lastUpdated: new Date()
            },
            update: {
                avgDeliveryTime: avgDeliveryDays,
                successRate: successRate * 100,
                rtoRate: rtoRate * 100,
                score,
                totalShipments: stats.total,
                lastUpdated: new Date()
            }
        });

        if (existing) {
            updated++;
        } else {
            created++;
        }

        console.log(`[CourierPerformance] ${courierName}: Score=${score.toFixed(1)}, Success=${(successRate * 100).toFixed(1)}%, RTO=${(rtoRate * 100).toFixed(1)}%, AvgDays=${avgDeliveryDays.toFixed(1)}`);
    }

    console.log(`[CourierPerformance] Metrics updated: ${updated} updated, ${created} created`);
    return { updated, created };
}

/**
 * Get current performance rankings
 */
export async function getCourierRankings(): Promise<CourierMetrics[]> {
    const rankings = await prisma.courierPerformance.findMany({
        orderBy: {
            score: "desc"
        }
    });

    return rankings.map((r: any) => ({
        courierName: r.courierName,
        totalShipments: r.totalShipments,
        delivered: 0, // Not stored separately
        rto: 0,
        avgDeliveryDays: Number(r.avgDeliveryTime),
        successRate: Number(r.successRate),
        rtoRate: Number(r.rtoRate),
        score: Number(r.score)
    }));
}
