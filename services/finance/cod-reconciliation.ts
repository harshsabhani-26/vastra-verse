/**
 * COD Reconciliation Service
 * 
 * Manages COD settlement tracking and reconciliation:
 * - Track COD collections
 * - Match settlements from courier
 * - Generate daily reconciliation reports
 * - Flag discrepancies
 */

import prisma from "@/lib/prisma";

interface ReconciliationEntry {
    shipmentId: string;
    awbNumber: string;
    orderId: string;
    codAmount: number;
    collectedAmount: number;
    settledAmount: number;
    gapAmount: number;
    settlementStatus: string;
}

interface DailyReconciliationReport {
    date: Date;
    totalOrders: number;
    totalCodAmount: number;
    collectedAmount: number;
    settledAmount: number;
    pendingAmount: number;
    gapAmount: number; // Discrepancies
    settlements: ReconciliationEntry[];
}

/**
 * Create or update COD reconciliation record
 */
export async function recordCodReconciliation(params: {
    shipmentId: string;
    codAmount: number;
    collectedDate?: Date;
    settlementDate?: Date;
    settlementReference?: string;
    settlementStatus?: string;
    gapAmount?: number;
}): Promise<void> {
    await prisma.codReconciliation.create({
        data: {
            shipmentId: params.shipmentId,
            codAmount: params.codAmount,
            collectedDate: params.collectedDate,
            settlementDate: params.settlementDate,
            settlementReference: params.settlementReference,
            settlementStatus: params.settlementStatus || "PENDING",
            gapAmount: params.gapAmount || 0,
            metadata: {}
        }
    });
}

/**
 * Update settlement status when payment received
 */
export async function settleCOD(params: {
    shipmentId: string;
    settledAmount: number;
    settlementDate: Date;
    settlementReference: string;
}): Promise<void> {
    // Fetch reconciliation record
    const records = await prisma.codReconciliation.findMany({
        where: { shipmentId: params.shipmentId }
    });

    if (records.length === 0) {
        throw new Error(`No COD reconciliation found for shipment ${params.shipmentId}`);
    }

    const record = records[0]; // Take the first one
    const expectedAmount = Number(record.codAmount);
    const gapAmount = expectedAmount - params.settledAmount;

    await prisma.codReconciliation.update({
        where: { id: record.id },
        data: {
            settlementDate: params.settlementDate,
            settlementReference: params.settlementReference,
            settlementStatus: Math.abs(gapAmount) < 1 ? "SETTLED" : "DISPUTED",
            gapAmount
        }
    });

    // Also update shipment record
    await prisma.shipment.update({
        where: { id: params.shipmentId },
        data: {
            codSettledAmount: params.settledAmount,
            codSettlementDate: params.settlementDate,
            codSettlementReference: params.settlementReference,
            codSettlementStatus: Math.abs(gapAmount) < 1 ? "SETTLED" : "DISPUTED"
        }
    });
}

/**
 * Generate daily COD reconciliation report
 */
export async function generateDailyReconciliationReport(date?: Date): Promise<DailyReconciliationReport> {
    const reportDate = date || new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all COD shipments delivered on this date
    const shipments = await prisma.shipment.findMany({
        where: {
            deliveredAt: {
                gte: startOfDay,
                lte: endOfDay
            },
            order: {
                paymentMethod: "COD"
            }
        },
        include: {
            order: true,
            codReconciliations: true
        }
    });

    const settlements: ReconciliationEntry[] = [];
    let totalCodAmount = 0;
    let collectedAmount = 0;
    let settledAmount = 0;
    let pendingAmount = 0;
    let gapAmount = 0;

    shipments.forEach(shipment => {
        const codAmt = Number(shipment.codRemittance || 0);
        const collected = Number(shipment.codCollectedAmount || 0);
        const settled = Number(shipment.codSettledAmount || 0);
        const gap = codAmt - settled;

        totalCodAmount += codAmt;
        collectedAmount += collected;
        settledAmount += settled;
        gapAmount += Math.abs(gap);

        if (shipment.codSettlementStatus === "PENDING" || !shipment.codSettlementStatus) {
            pendingAmount += codAmt;
        }

        settlements.push({
            shipmentId: shipment.id,
            awbNumber: shipment.awbNumber || "N/A",
            orderId: shipment.orderId,
            codAmount: codAmt,
            collectedAmount: collected,
            settledAmount: settled,
            gapAmount: gap,
            settlementStatus: shipment.codSettlementStatus || "PENDING"
        });
    });

    return {
        date: reportDate,
        totalOrders: shipments.length,
        totalCodAmount,
        collectedAmount,
        settledAmount,
        pendingAmount,
        gapAmount,
        settlements
    };
}

/**
 * Get all pending COD settlements
 */
export async function getPendingCodSettlements(): Promise<ReconciliationEntry[]> {
    const shipments = await prisma.shipment.findMany({
        where: {
            codSettlementStatus: {
                in: ["PENDING", "COLLECTED"]
            },
            status: "DELIVERED",
            order: {
                paymentMethod: "COD"
            }
        },
        include: {
            order: true
        },
        orderBy: {
            deliveredAt: "asc"
        }
    });

    return shipments.map(s => ({
        shipmentId: s.id,
        awbNumber: s.awbNumber || "N/A",
        orderId: s.orderId,
        codAmount: Number(s.codRemittance || 0),
        collectedAmount: Number(s.codCollectedAmount || 0),
        settledAmount: Number(s.codSettledAmount || 0),
        gapAmount: Number(s.codRemittance || 0) - Number(s.codSettledAmount || 0),
        settlementStatus: s.codSettlementStatus || "PENDING"
    }));
}

/**
 * Bulk reconcile COD from courier settlement report (CSV/API)
 */
export async function bulkReconcileCod(settlements: Array<{
    awbNumber: string;
    settledAmount: number;
    settlementDate: Date;
    settlementReference: string;
}>): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const settlement of settlements) {
        try {
            const shipment = await prisma.shipment.findUnique({
                where: { awbNumber: settlement.awbNumber }
            });

            if (!shipment) {
                errors.push(`AWB ${settlement.awbNumber}: Shipment not found`);
                failed++;
                continue;
            }

            await settleCOD({
                shipmentId: shipment.id,
                settledAmount: settlement.settledAmount,
                settlementDate: settlement.settlementDate,
                settlementReference: settlement.settlementReference
            });

            success++;
        } catch (error: any) {
            errors.push(`AWB ${settlement.awbNumber}: ${error.message}`);
            failed++;
        }
    }

    return { success, failed, errors };
}
