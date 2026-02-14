
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { ReturnRequest, Payment, Order } from "@prisma/client";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

interface RefundResult {
    success: boolean;
    refundId?: string;
    error?: string;
}

/**
 * Process a refund for a return request.
 * 
 * @param returnRequestId The ID of the return request to process
 * @param amount The amount to refund (in major units, e.g., 500 INR). If not provided, refunds full amount.
 * @param adminId ID of the admin processing the refund
 */
export async function processReturnRefund(
    returnRequestId: string,
    adminId: string,
    amount?: number
): Promise<RefundResult> {
    try {
        // 1. Fetch Return Request with relations
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: {
                order: {
                    include: {
                        payments: {
                            where: { status: "COMPLETED" }, // Only refund completed payments
                            take: 1
                        }
                    }
                }
            }
        });

        if (!returnRequest) {
            return { success: false, error: "Return request not found" };
        }

        if (returnRequest.status === "REFUND_COMPLETED") {
            return { success: true };
        }

        const payment = returnRequest.order.payments[0];
        if (!payment || !payment.gatewayPaymentId) {
            return { success: false, error: "No valid paid payment found for this order" };
        }

        // 2. Validate Amount
        const refundAmount = amount || Number(returnRequest.order.total); // Default to full order total if not specified
        // Logic could be refined to refund only item price if partial return. 
        // For now, assuming full refund or manually passed amount.

        // 3. Call Razorpay API
        // Razorpay expects amount in paise
        const refundOptions = {
            payment_id: payment.gatewayPaymentId,
            amount: Math.round(refundAmount * 100),
            notes: {
                returnRequestId: returnRequest.id,
                orderId: returnRequest.orderId,
            }
        };

        let razorpayRefund;
        try {
            razorpayRefund = await razorpay.payments.refund(payment.gatewayPaymentId, refundOptions);
        } catch (rpError: any) {
            console.error("Razorpay Refund Failed:", rpError);
            return { success: false, error: rpError.error?.description || "Razorpay refund failed" };
        }

        // 4. Update Database in Transaction
        const refundId = razorpayRefund.id;

        await prisma.$transaction(async (tx) => {
            // Create Refund Record
            const refundRecord = await tx.refund.create({
                data: {
                    paymentId: payment.id,
                    orderId: returnRequest.orderId,
                    amount: refundAmount,
                    reason: returnRequest.reason,
                    status: "PROCESSED",
                    gatewayRefundId: refundId,
                    gatewayStatus: razorpayRefund.status,
                    requestedBy: returnRequest.userId,
                    processedBy: adminId,
                    processedAt: new Date(),
                    returnRequestId: returnRequest.id
                }
            });

            // Update Return Request
            await tx.returnRequest.update({
                where: { id: returnRequest.id },
                data: {
                    status: "REFUND_COMPLETED",
                    refundInitiatedAt: new Date(),
                    refundCompletedAt: new Date()
                }
            });

            // Update Order Payment Status if full refund
            // Simplification: If refund amount >= payment amount, mark refunded.
            if (refundAmount >= Number(payment.amount)) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: "REFUNDED" }
                });

                await tx.order.update({
                    where: { id: returnRequest.orderId },
                    data: {
                        paymentStatus: "REFUNDED",
                        refundStatus: "FULL",
                        status: "RETURNED"
                    }
                });
            } else {
                await tx.order.update({
                    where: { id: returnRequest.orderId },
                    data: {
                        refundStatus: "PARTIAL"
                    }
                });
            }
        });

        return { success: true, refundId: refundId };

    } catch (error) {
        console.error("Refund Process Error:", error);
        return { success: false, error: "Internal processing error" };
    }
}
