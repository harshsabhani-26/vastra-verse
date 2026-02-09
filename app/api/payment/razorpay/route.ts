import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";
import { getPaymentRateLimiter } from "@/lib/rate-limit";
import { logError, logPaymentEvent, logRateLimitViolation } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        // SECURITY: Authentication check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // SECURITY: Strict payment rate limiting (3 requests per minute)
        const limiter = getPaymentRateLimiter();
        const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
        const { success, limit, reset, remaining } = await limiter.limit(session.user.id);

        if (!success) {
            logRateLimitViolation("/api/payment/razorpay", session.user.id, ip);
            return new NextResponse("Too many payment requests - please try again later", {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                },
            });
        }

        const body = await req.json();
        const { amount, currency = "INR", receipt } = body;

        // SECURITY: Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (process.env.NODE_ENV === "development") {
            console.log("Creating Razorpay order:", { amount, currency, receipt });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            logError("RAZORPAY_CONFIG", new Error("Razorpay credentials missing"));
            return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), // amount in paisa
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);

        // Log payment initiation
        logPaymentEvent("PAYMENT_INITIATED", receipt, {
            userId: session.user.id,
            amount,
            razorpayOrderId: order.id,
        });

        if (process.env.NODE_ENV === "development") {
            console.log("Razorpay order created successfully:", order);
        }
        return NextResponse.json(order);
    } catch (error: any) {
        logError("RAZORPAY_ORDER", error, {
            message: error.message,
            description: error.error?.description,
            statusCode: error.statusCode,
            code: error.error?.code,
        });
        return NextResponse.json({
            error: "Failed to create order",
            details: error.message || "Unknown error"
        }, { status: 500 });
    }
}
