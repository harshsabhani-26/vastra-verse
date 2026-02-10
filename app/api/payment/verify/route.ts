import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/email";
import { getPaymentRateLimiter } from "@/lib/rate-limit";
import { logError, logPaymentEvent, logRateLimitViolation } from "@/lib/logger";
import { clearCart } from "@/app/actions/cart";
import { createOrderAfterPayment } from "@/app/actions/checkout";

/**
 * CRITICAL FIX: Create Order ONLY After Payment Verification
 * 
 * NEW FLOW:
 * 1. Frontend validates cart and collects order data
 * 2. Razorpay order created with order data in 'notes' field
 * 3. User completes payment
 * 4. THIS ROUTE verifies signature
 * 5. If valid -> create Order record with paymentStatus="PAID"
 * 6. If invalid -> return error, NO order created
 * 
 * This ensures failed/cancelled payments NEVER create orphaned orders.
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

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, checkoutSessionId } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing required payment parameters" }, { status: 400 });
        }

        if (!orderData) {
            return NextResponse.json({ error: "Missing order data" }, { status: 400 });
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
            console.log("[IDEMPOTENCY] Payment already processed", {
                razorpayPaymentId: razorpay_payment_id,
                existingOrderId: existingPayment.orderId,
                checkoutSessionId,
            });
            // Payment was already verified - return success to avoid errors
            return NextResponse.json({
                success: true,
                message: "Payment already processed",
                alreadyProcessed: true,
                orderId: existingPayment.orderId
            });
        }

        // Verify Razorpay Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            logPaymentEvent("PAYMENT_VERIFICATION_FAILED", razorpay_order_id, {
                reason: "Invalid signature",
                razorpayOrderId: razorpay_order_id,
                ipAddress: ip,
            });
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // SIGNATURE VALID - Now create the Order
        if (process.env.NODE_ENV === "development") {
            console.log("[PAYMENT_VERIFY] Signature valid, creating order for user:", session.user.id);
        }

        // Create order using the new function
        const orderId = await createOrderAfterPayment({
            userId: session.user.id,
            items: orderData.items,
            total: orderData.total,
            subtotal: orderData.subtotal,
            discount: orderData.discount || 0,
            shippingCharges: orderData.shippingCharges || 0,
            cgst: orderData.cgst,
            sgst: orderData.sgst,
            igst: orderData.igst,
            gstRate: orderData.gstRate,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            shippingAddress: orderData.shippingAddress,
            shippingState: orderData.shippingState,
            couponCode: orderData.couponCode || null,
            couponId: orderData.couponId || null,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            checkoutSessionId: checkoutSessionId || null,
        });

        // Clean up pending order data (consumed by client verify)
        try {
            const { removePendingOrderData } = await import("@/lib/payment-store");
            removePendingOrderData(razorpay_order_id);
        } catch { /* best-effort cleanup */ }

        // After successful order creation, generate invoice
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

        // CRITICAL: Clear the user's cart after successful purchase
        try {
            await clearCart();
            console.log("[CART_CLEARED] Server-side", { orderId, paymentMethod: "Prepaid" });
        } catch (cartError) {
            logError("CART_CLEAR_ERROR", cartError);
            // Don't fail the request, just log it
        }

        return NextResponse.json({ success: true, orderId });

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

        if (error.message?.includes("not found") || error.message?.includes("no longer available")) {
            return NextResponse.json({
                error: "Payment received but some products are no longer available. Please contact support.",
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            error: "Payment verification failed",
            details: error.message || "Unknown error"
        }, { status: 500 });
    }
}
