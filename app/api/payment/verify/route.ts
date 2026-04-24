import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError, logPaymentEvent } from "@/lib/logger";
import { clearCart } from "@/app/actions/cart";
import { recordPaymentSuccess, recordPaymentFailure, recordOrderCreated } from "@/lib/metrics";
import { createAlert } from "@/lib/system-alerts";
import { createOrderAfterPayment } from "@/app/actions/checkout";
import { inngest } from "@/lib/inngest";

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

export async function POST(req: NextRequest) {
    try {
        // SECURITY: Strict rate limiting (3 req/min) for payment verification
        const rateLimitResult = await checkRateLimit(req, 'paymentVerify');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const { identifier } = rateLimitResult;

        const session = await auth();
        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData, checkoutSessionId } = body;

        // TEST BYPASS FOR LOAD TESTING
        const isTestRequest = process.env.NODE_ENV === "development" && razorpay_signature === "test_signature";
        
        let userId = session?.user?.id;
        if (isTestRequest && body.userId) {
            userId = body.userId;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        if (!isTestRequest && generated_signature !== razorpay_signature) {
            logPaymentEvent("PAYMENT_VERIFICATION_FAILED", razorpay_order_id, {
                reason: "Invalid signature",
                razorpayOrderId: razorpay_order_id,
                ipAddress: identifier,
            });

            // Track payment failure metrics + alert
            recordPaymentFailure();
            createAlert(
                'PAYMENT_FAILURE',
                'WARNING',
                `Payment signature verification failed for order ${razorpay_order_id}`,
                { razorpayOrderId: razorpay_order_id, reason: 'Invalid signature' }
            );

            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // SIGNATURE VALID - Now create the Order
        if (process.env.NODE_ENV === "development") {
            console.log("[PAYMENT_VERIFY] Signature valid, creating order for user:", userId);
        }

        // Create order using the new function
        const orderId = await createOrderAfterPayment({
            userId: userId,
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
            shippingCity: orderData.shippingCity || "Unknown",
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

        // After successful order creation, dispatch invoice generation as a background job.
        // This makes the payment response instant — invoice is generated asynchronously
        // with automatic retries via Inngest.
        inngest.send({
            name: 'invoice/generate',
            data: {
                orderId,
                userId: userId,
            },
        }).catch((err) => logError('INNGEST_DISPATCH', err, { orderId }));

        // Track business metrics (non-blocking)
        recordOrderCreated(Number(orderData.total));
        recordPaymentSuccess(Number(orderData.total));

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
