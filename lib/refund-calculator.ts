import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface ReturnItemInput {
    orderItemId: string;
    quantity: number;
}

export interface RefundCalculation {
    returnItemInputs: Array<{
        orderItemId: string;
        quantity: number;
        refundAmount: number;
    }>;
    totalRefundAmount: number;
}

/**
 * Calculate refund amount for partial returns
 * Based on selected items and quantities
 */
export async function calculateRefundAmount(
    orderId: string,
    items: ReturnItemInput[]
): Promise<RefundCalculation> {
    // Fetch order with items
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: { product: true }
            }
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    const returnItemInputs: Array<{
        orderItemId: string;
        quantity: number;
        refundAmount: number;
    }> = [];

    let totalRefundAmount = 0;

    for (const returnItem of items) {
        const orderItem = order.items.find(i => i.id === returnItem.orderItemId);

        if (!orderItem) {
            throw new Error(`Order item ${returnItem.orderItemId} not found`);
        }

        // Validate quantity
        if (returnItem.quantity > orderItem.quantity) {
            throw new Error(`Cannot return more than purchased quantity for item ${orderItem.id}`);
        }

        // Calculate proportional refund
        const pricePerUnit = Number(orderItem.price);
        const refundAmount = pricePerUnit * returnItem.quantity;

        returnItemInputs.push({
            orderItemId: returnItem.orderItemId,
            quantity: returnItem.quantity,
            refundAmount
        });

        totalRefundAmount += refundAmount;
    }

    // Apply proportional shipping/tax if full order returned
    const allItemsReturned = order.items.every(orderItem => {
        const returnItem = items.find(ri => ri.orderItemId === orderItem.id);
        return returnItem && returnItem.quantity === orderItem.quantity;
    });

    if (allItemsReturned) {
        // Include shipping and taxes
        totalRefundAmount += Number(order.shippingCharges || 0);
        totalRefundAmount += Number(order.cgst || 0);
        totalRefundAmount += Number(order.sgst || 0);
        totalRefundAmount += Number(order.igst || 0);
    }

    return {
        returnItemInputs,
        totalRefundAmount
    };
}

/**
 * Calculate refund for full order (legacy support)
 */
export async function calculateFullOrderRefund(orderId: string): Promise<number> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { total: true }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return Number(order.total);
}
