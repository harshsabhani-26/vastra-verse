
import prisma from "@/lib/prisma";
import { RefundMethodEnum, PaymentMethodEnum } from "@prisma/client";
import { recordRefund } from "@/lib/metrics";

/**
 * Production-Grade Refund Service
 * Handles automatic (Razorpay) and manual (COD) refund workflows
 */

interface RefundResult {
    success: boolean;
    refundId?: string;
    error?: string;
    message?: string;
}

interface ManualRefundDetails {
    method: "MANUAL_UPI" | "MANUAL_BANK" | "STORE_CREDIT";
    upiId?: string;
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    notes?: string;
}

/**
 * Main refund entry point - routes to appropriate flow based on payment method
 * 
 * @param returnRequestId The ID of the return request to process
 * @param adminId ID of the admin processing the refund
 * @param manualDetails Optional manual refund details for COD orders
 */
export async function processReturnRefund(
    returnRequestId: string,
    adminId: string,
    manualDetails?: ManualRefundDetails
): Promise<RefundResult> {
    try {
        // 1. Fetch Return Request with order and payment info
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: {
                order: {
                    include: {
                        payments: {
                            where: { status: "COMPLETED" },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!returnRequest) {
            return { success: false, error: "Return request not found" };
        }

        // Prevent duplicate refunds
        if (returnRequest.status === "REFUND_COMPLETED") {
            return { success: true, message: "Refund already completed" };
        }

        const order = returnRequest.order;
        const payment = order.payments[0];

        // 2. ROUTE BASED ON PAYMENT METHOD
        if (order.paymentMethod === "COD") {
            // COD Flow - Manual Refund
            return await processCODRefund(returnRequest.id, order.id, adminId, manualDetails);
        } else {
            // Online Payment Flow - Automatic Razorpay Refund
            if (!payment || !payment.gatewayPaymentId) {
                return {
                    success: false,
                    error: "No valid online payment found. This order was not paid via Razorpay."
                };
            }
            return await processOnlineRefund(
                returnRequest.id,
                order.id,
                payment.id,
                payment.gatewayPaymentId,
                Number(returnRequest.refundAmount),
                adminId
            );
        }

    } catch (error) {
        console.error("Refund Process Error:", error);
        return { success: false, error: "Internal processing error" };
    }
}

/**
 * Process automatic refund via Razorpay
 * Sets status to INITIATED and waits for webhook confirmation
 */
async function processOnlineRefund(
    returnRequestId: string,
    orderId: string,
    paymentId: string,
    gatewayPaymentId: string,
    refundAmount: number,
    adminId: string
): Promise<RefundResult> {
    try {
        // 1. Create Refund Record with PENDING status first
        // We generate a temp ID that will be updated by the worker with real gateway ID
        const refundRecord = await prisma.$transaction(async (tx) => {
            const refund = await tx.refund.create({
                data: {
                    paymentId: paymentId,
                    orderId: orderId,
                    amount: refundAmount,
                    reason: "Customer Return",
                    status: "INITIATED",
                    refundMethod: "AUTOMATIC",
                    gatewayRefundId: `PENDING_${Date.now()}`, // Temporary placeholder
                    gatewayStatus: "queued",
                    requestedBy: adminId,
                    processedBy: adminId,
                    processedAt: new Date(),
                    returnRequestId: returnRequestId
                }
            });

            // Update return request status
            await tx.returnRequest.update({
                where: { id: returnRequestId },
                data: {
                    status: "REFUND_PENDING",
                    refundInitiatedAt: new Date()
                }
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId: orderId,
                    event: "REFUND_INITIATED",
                    details: `Refund queued for processing. Waiting for gateway execution.`,
                    createdBy: adminId
                }
            });

            return refund;
        });

        // 2. Enqueue Refund Job
        // Import dynamically to avoid circular deps if any
        const { refundQueue } = await import('@/lib/queue');

        await refundQueue().add('process-refund', {
            refundId: refundRecord.id,
            paymentId: paymentId,
            gatewayPaymentId: gatewayPaymentId,
            amount: refundAmount,
            orderId: orderId,
            reason: "Customer Return"
        });

        return {
            success: true,
            refundId: refundRecord.id,
            message: "Refund job queued successfully. Background worker will process it shortly."
        };

    } catch (error: any) {
        console.error("Refund Queue Error:", error);

        return {
            success: false,
            error: error.message || "Failed to queue refund. Please try again."
        };
    }
}

/**
 * Process manual COD refund
 * Sets status to MANUAL_REFUND_PENDING until admin confirms
 */
async function processCODRefund(
    returnRequestId: string,
    orderId: string,
    adminId: string,
    manualDetails?: ManualRefundDetails
): Promise<RefundResult> {
    try {
        if (!manualDetails) {
            return {
                success: false,
                error: "Manual refund details required for COD orders (UPI/Bank/Store Credit)"
            };
        }

        // Get return request to fetch refund amount
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: { order: true }
        });

        if (!returnRequest) {
            return { success: false, error: "Return request not found" };
        }

        // Create a "dummy" payment record for COD if it doesn't exist
        // This maintains referential integrity
        let payment = await prisma.payment.findFirst({
            where: {
                orderId: orderId,
                method: "COD"
            }
        });

        if (!payment) {
            payment = await prisma.payment.create({
                data: {
                    orderId: orderId,
                    amount: returnRequest.order.total,
                    currency: "INR",
                    status: "COMPLETED",
                    method: "COD",
                    gatewayProvider: "MANUAL"
                }
            });
        }

        // Create manual refund record
        const refundRecord = await prisma.$transaction(async (tx) => {
            const refund = await tx.refund.create({
                data: {
                    paymentId: payment.id,
                    orderId: orderId,
                    amount: Number(returnRequest.refundAmount),
                    reason: "COD Customer Return",
                    status: "PENDING", // Will be updated when admin confirms
                    refundMethod: manualDetails.method as RefundMethodEnum,
                    manualRefundUpiId: manualDetails.upiId,
                    manualRefundBankName: manualDetails.bankName,
                    manualRefundAccountNo: manualDetails.accountNo,
                    manualRefundIfsc: manualDetails.ifsc,
                    manualRefundNotes: manualDetails.notes,
                    requestedBy: adminId,
                    processedBy: adminId,
                    returnRequestId: returnRequestId
                }
            });

            // Update return request
            await tx.returnRequest.update({
                where: { id: returnRequestId },
                data: {
                    status: "REFUND_PENDING"
                }
            });

            // Create timeline entry
            await tx.orderTimeline.create({
                data: {
                    orderId: orderId,
                    event: "COD_REFUND_PENDING",
                    details: `Manual ${manualDetails.method} refund details saved. Admin needs to send payment and confirm.`,
                    createdBy: adminId
                }
            });

            return refund;
        });

        return {
            success: true,
            refundId: refundRecord.id,
            message: `Manual refund details saved. Please send ₹${returnRequest.refundAmount} via ${manualDetails.method} and confirm.`
        };

    } catch (error) {
        console.error("COD Refund Error:", error);
        return { success: false, error: "Failed to process COD refund" };
    }
}

/**
 * Confirm COD refund after admin has sent payment manually
 * 
 * @param refundId The refund record ID
 * @param adminId Admin confirming the refund
 */
export async function confirmCODRefund(
    refundId: string,
    adminId: string
): Promise<RefundResult> {
    try {
        const refund = await prisma.refund.findUnique({
            where: { id: refundId },
            include: { returnRequest: true }
        });

        if (!refund) {
            return { success: false, error: "Refund not found" };
        }

        if (refund.refundMethod === "AUTOMATIC") {
            return { success: false, error: "This is an automatic refund. Cannot manually confirm." };
        }

        if (refund.status === "PROCESSED") {
            return { success: true, message: "Refund already confirmed" };
        }

        // Mark as processed
        await prisma.$transaction(async (tx) => {
            await tx.refund.update({
                where: { id: refundId },
                data: {
                    status: "PROCESSED",
                    processedAt: new Date(),
                    processedBy: adminId
                }
            });

            // Update return request
            if (refund.returnRequest) {
                await tx.returnRequest.update({
                    where: { id: refund.returnRequest.id },
                    data: {
                        status: "REFUND_COMPLETED",
                        refundCompletedAt: new Date()
                    }
                });
            }

            // Update order
            await tx.order.update({
                where: { id: refund.orderId },
                data: {
                    paymentStatus: "REFUNDED",
                    refundStatus: "FULL",
                    status: "REFUNDED"
                }
            });

            // Timeline
            await tx.orderTimeline.create({
                data: {
                    orderId: refund.orderId,
                    event: "COD_REFUND_CONFIRMED",
                    details: `Admin confirmed manual refund of ₹${refund.amount} was sent to customer.`,
                    createdBy: adminId
                }
            });
        });

        // Track refund metric (non-blocking)
        recordRefund(Number(refund.amount));

        return { success: true, message: "COD refund confirmed successfully" };

    } catch (error) {
        console.error("COD Refund Confirmation Error:", error);
        return { success: false, error: "Failed to confirm COD refund" };
    }
}
