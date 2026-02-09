import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/email";
import { getPaymentRateLimiter } from "@/lib/rate-limit";
import { logError, logPaymentEvent, logRateLimitViolation } from "@/lib/logger";

/**
 * CRITICAL FIX: Payment Verification with Stock Reduction
 * 
 * This route now handles:
 * 1. Rate limiting - prevents abuse
 * 2. Idempotency - prevents duplicate payment processing
 * 3. Stock reduction - ONLY after payment is verified
 * 4. Atomic operations - all updates in a single transaction
 * 5. Proper error handling and rollback
 */

export async function POST(req: Request) {
    try {
        // SECURITY: Strict rate limiting for payment endpoints
        const rateLimiter = getPaymentRateLimiter();
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const { success } = await rateLimiter.limit(ip);

        if (!success) {
            logRateLimitViolation("/api/payment/verify", ip, ip);
            return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
        }
        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return NextResponse.json({ error: "Missing required payment parameters" }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            logError("PAYMENT_VERIFY_CONFIG", new Error("Razorpay secret missing"));
            return NextResponse.json({ error: "Razorpay secret missing" }, { status: 500 });
        }

        // IDEMPOTENCY CHECK: Check if this payment was already processed
        const existingPayment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { gatewayPaymentId: razorpay_payment_id },
                    { gatewayOrderId: razorpay_order_id }
                ]
            }
        });

        if (existingPayment) {
            if (process.env.NODE_ENV === "development") {
                console.log("Payment already processed:", razorpay_payment_id);
            }
            // Payment was already verified - return success to avoid errors
            return NextResponse.json({
                success: true,
                message: "Payment already processed",
                alreadyProcessed: true
            });
        }

        // Verify Razorpay Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            logPaymentEvent("PAYMENT_VERIFICATION_FAILED", orderId, {
                reason: "Invalid signature",
                razorpayOrderId: razorpay_order_id,
                ipAddress: ip,
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // ATOMIC TRANSACTION: Update order, reduce stock, create payment record
        await prisma.$transaction(async (tx) => {
            // Fetch order with items
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    user: true
                }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            // Check if order is already paid
            if (order.paymentStatus === "PAID") {
                throw new Error("Order already marked as paid");
            }

            // CRITICAL: Reduce stock for each item
            for (const item of order.items) {
                const currentProduct = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { stock: true, name: true }
                });

                if (!currentProduct) {
                    throw new Error(`Product ${item.productId} not found during payment verification`);
                }

                if (currentProduct.stock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for "${currentProduct.name}". ` +
                        `Available: ${currentProduct.stock}, Required: ${item.quantity}`
                    );
                }

                // Reduce stock atomically
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Update Order Status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CONFIRMED",
                    paymentStatus: "PAID",
                    paymentMethod: "Prepaid (Razorpay)",
                },
            });

            // Create Payment Record
            await tx.payment.create({
                data: {
                    orderId: orderId,
                    amount: order.total,
                    currency: "INR",
                    status: "COMPLETED",
                    method: "UPI", // Default - could be determined from Razorpay response
                    gatewayProvider: "razorpay",
                    gatewayOrderId: razorpay_order_id,
                    gatewayPaymentId: razorpay_payment_id,
                    gatewaySignature: razorpay_signature,
                    subtotal: order.subtotal,
                    cgst: order.cgst,
                    sgst: order.sgst,
                    igst: order.igst,
                    gstRate: order.gstRate,
                    verifiedAt: new Date(),
                }
            });

            // Create Timeline Events
            await tx.orderTimeline.createMany({
                data: [
                    {
                        orderId: orderId,
                        event: "Payment Received",
                        details: `Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}`,
                        createdBy: "system"
                    },
                    {
                        orderId: orderId,
                        event: "Stock Reduced",
                        details: `Stock reduced for ${order.items.length} items`,
                        createdBy: "system"
                    }
                ]
            });

            // Generate & Send Invoice (Outside transaction - non-critical)
            // We''ll do this after transaction commits
        });

        // After successful transaction, generate invoice
        try {
            const fullOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (fullOrder) {
                if (process.env.NODE_ENV === "development") {
                    console.log("Generating invoice for order:", orderId);
                }
                const pdfBuffer = await generateInvoicePDF(fullOrder);

                const customerEmail = fullOrder.user?.email;
                const customerName = fullOrder.user?.name || fullOrder.customerName || "Customer";

                if (customerEmail) {
                    if (process.env.NODE_ENV === "development") {
                        console.log("Sending invoice email to:", customerEmail);
                    }
                    await sendInvoiceEmail(customerEmail, orderId, customerName, pdfBuffer);

                    await prisma.orderTimeline.create({
                        data: {
                            orderId: orderId,
                            event: "Invoice Sent",
                            details: `Invoice emailed to ${customerEmail}`,
                            createdBy: "system"
                        }
                    });
                }
            }
        } catch (invError) {
            logError("INVOICE_GENERATION", invError);
            // Don't fail the request - payment was successful
        }

        // Log successful payment
        logPaymentEvent("PAYMENT_SUCCESS", orderId, {
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        logError("PAYMENT_VERIFICATION", error, {
            message: error.message,
            stack: error.stack,
        });

        // Provide specific error messages
        if (error.message?.includes("Insufficient stock")) {
            return NextResponse.json({
                error: "Payment received but order cannot be fulfilled due to insufficient stock. Please contact support.",
                details: error.message
            }, { status: 400 });
        }

        if (error.message?.includes("already marked as paid")) {
            return NextResponse.json({
                error: "This order was already processed",
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            error: "Verification failed",
            details: error.message || "Unknown error"
        }, { status: 500 });
    }
}
