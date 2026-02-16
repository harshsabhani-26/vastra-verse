/**
 * COD Reconciliation Service
 * 
 * Manages:
 * - COD amount tracking
 * - Settlement matching
 * - Reconciliation reporting
 * - Dispute management
 */

import prisma from "@/lib/prisma";
import { CodSettlementStatus, Prisma } from "@prisma/client";

interface CodReconciliationReport {
    date: Date;
    totalCodOrders: number;
    totalCodAmount: number;
    collectedAmount: number;
    settledAmount: number;
    pendingAmount: number;
    disputedAmount: number;
    settlementRate: number; // percentage
}

interface CodShipment {
    id: string;
    orderId: string;
    awbNumber: string | null;
    codRemittance: Prisma.Decimal | null;
    codCollectedAmount: Prisma.Decimal | null;
    codSettledAmount: Prisma.Decimal | null;
    codSettlementStatus: CodSettlementStatus | null;
    codSettlementDate: Date | null;
    codTransactionId: string | null;
}

/**
 * Generate daily COD reconciliation report
 */
export async function generateCodReport(date: Date = new Date()): Promise<CodReconciliationReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all COD shipments for the day
    const shipments = await prisma.shipment.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            },
            order: {
                paymentMethod: "COD"
            },
            status: "DELIVERED" // Only delivered orders
        },
        select: {
            codRemittance: true,
            codCollectedAmount: true,
            codSettledAmount: true,
            codSettlementStatus: true
        }
    });

    const totalCodOrders = shipments.length;
    const totalCodAmount = shipments.reduce((sum, s) => sum + Number(s.codRemittance || 0), 0);
    const collectedAmount = shipments.reduce((sum, s) => sum + Number(s.codCollectedAmount || 0), 0);
    const settledAmount = shipments.reduce((sum, s) => sum + Number(s.codSettledAmount || 0), 0);

    // Calculate by status
    const pending = shipments.filter(s => s.codSettlementStatus === "PENDING");
    const disputed = shipments.filter(s => s.codSettlementStatus === "DISPUTED");

    const pendingAmount = pending.reduce((sum, s) => sum + Number(s.codRemittance || 0), 0);
    const disputedAmount = disputed.reduce((sum, s) => sum + Number(s.codRemittance || 0), 0);

    const settlementRate = totalCodAmount > 0
        ? (settledAmount / totalCodAmount) * 100
        : 0;

    return {
        date,
        totalCodOrders,
        totalCodAmount,
        collectedAmount,
        settledAmount,
        pendingAmount,
        disputedAmount,
        settlementRate: Number(settlementRate.toFixed(2))
    };
}

/**
 * Get all pending COD settlements
 */
export async function getPendingCodSettlements(): Promise<CodShipment[]> {
    const shipments = await prisma.shipment.findMany({
        where: {
            codSettlementStatus: "PENDING",
            status: "DELIVERED",
            order: {
                paymentMethod: "COD"
            }
        },
        select: {
            id: true,
            orderId: true,
            awbNumber: true,
            codRemittance: true,
            codCollectedAmount: true,
            codSettledAmount: true,
            codSettlementStatus: true,
            codSettlementDate: true,
            codTransactionId: true
        },
        orderBy: {
            deliveredAt: "asc"
        }
    });

    return shipments;
}

/**
 * Mark COD as collected
 */
export async function markCodCollected(
    shipmentId: string,
    collectedAmount: number
): Promise<void> {
    await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
            codCollectedAmount: collectedAmount,
            codSettlementStatus: "COLLECTED"
        }
    });
}

/**
 * Mark COD as settled
 */
export async function markCodSettled(
    shipmentId: string,
    settledAmount: number,
    transactionId: string,
    settlementReference?: string
): Promise<void> {
    await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
            codSettledAmount: settledAmount,
            codSettlementDate: new Date(),
            codTransactionId: transactionId,
            codSettlementReference: settlementReference,
            codSettlementStatus: "SETTLED"
        }
    });
}

/**
 * Mark COD as disputed
 */
export async function markCodDisputed(
    shipmentId: string,
    reason?: string
): Promise<void> {
    await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
            codSettlementStatus: "DISPUTED",
            failureReason: reason
        }
    });
}

/**
 * Bulk settle COD shipments (for reconciliation batches)
 */
export async function bulkSettleCod(settlements: Array<{
    shipmentId: string;
    settledAmount: number;
    transactionId: string;
    reference?: string;
}>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const settlement of settlements) {
        try {
            await markCodSettled(
                settlement.shipmentId,
                settlement.settledAmount,
                settlement.transactionId,
                settlement.reference
            );
            success++;
        } catch (error) {
            console.error(`Failed to settle ${settlement.shipmentId}:`, error);
            failed++;
        }
    }

    return { success, failed };
}
