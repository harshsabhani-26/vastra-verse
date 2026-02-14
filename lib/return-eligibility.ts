
import { Order, OrderStatus } from "@prisma/client";

export const RETURN_WINDOW_DAYS = 7;

interface ReturnEligibilityResult {
    isEligible: boolean;
    reason?: string;
}

/**
 * Checks if an order is eligible for return.
 * Rules:
 * 1. Order status must be DELIVERED.
 * 2. Must be within 7 days of delivery (or creation if delivery date not tracked specifically, though we should track it).
 *    Note: The schema has `updatedAt` which might proxy for delivery time if status is DELIVERED, 
 *    but ideally we'd have `deliveredAt`. For now, we'll use `updatedAt` if status is DELIVERED.
 * 3. Payment must be PAID (implied if delivered usually, but good to check).
 * 4. No existing active return request (checked at DB level before calling this or inside this if we fetch relations).
 */
export function canRequestReturn(order: Order & { returnRequests?: any[] }): ReturnEligibilityResult {
    // 1. Check Status
    if (order.status !== "DELIVERED") {
        return {
            isEligible: false,
            reason: "Order has not been delivered yet.",
        };
    }

    // 2. Check Payment Status
    // For DELIVERED orders, payment must be confirmed (PAID status)
    if (order.paymentStatus !== "PAID") {
        return {
            isEligible: false,
            reason: "Payment status is not confirmed.",
        };
    }

    // 3. Check Time Window
    // Using updatedAt as a proxy for delivery time since we don't have a specific `deliveredAt` field in the schema excerpt provided.
    // If you add `deliveredAt` to Order, swap this.
    const deliveryDate = new Date(order.updatedAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - deliveryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > RETURN_WINDOW_DAYS) {
        return {
            isEligible: false,
            reason: `Return window of ${RETURN_WINDOW_DAYS} days has expired.`,
        };
    }

    // 4. Check Existing Returns
    if (order.returnRequests && order.returnRequests.length > 0) {
        // If there's any return request that is not CLOSED or REJECTED, block new ones.
        // Assuming we pass relation. If not passed, this check is skipped here and should be done by caller.
        const hasActiveReturn = order.returnRequests.some(req =>
            !["CLOSED", "REJECTED"].includes(req.status)
        );

        if (hasActiveReturn) {
            return {
                isEligible: false,
                reason: "A return request is already active for this order.",
            };
        }
    }

    return { isEligible: true };
}
