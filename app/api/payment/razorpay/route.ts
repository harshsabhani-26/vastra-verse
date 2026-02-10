import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logError, logPaymentEvent } from "@/lib/logger";
import { storePendingOrderData } from "@/lib/payment-store";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            logError("RAZORPAY_ORDER", new Error("Unauthorized access attempt"));
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { amount, currency = "INR", receipt, notes, orderData, checkoutSessionId } = body;

        // Detailed Logging
        logPaymentEvent("PAYMENT_INITIATED", receipt || "unknown", {
            amount,
            currency,
            checkoutSessionId,
            hasKeyId: !!process.env.RAZORPAY_KEY_ID,
            hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        });

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            logError("RAZORPAY_ORDER", new Error("Razorpay keys missing in environment variables"));
            return NextResponse.json(
                { error: "Payment configuration error: Missing keys" },
                { status: 500 }
            );
        }

        if (!amount || amount < 1) {
            logError("RAZORPAY_ORDER", new Error(`Invalid amount: ${amount}`));
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt,
            notes: {
                ...notes,
                checkoutSessionId: checkoutSessionId || "",
            },
        };

        const order = await razorpay.orders.create(options);
        logPaymentEvent("PAYMENT_INITIATED", order.id, {
            status: "order_created",
            checkoutSessionId,
        });

        // Store order data for webhook fallback retrieval
        if (orderData) {
            storePendingOrderData(order.id, {
                orderData,
                checkoutSessionId: checkoutSessionId || "",
            });
        }

        return NextResponse.json(order);
    } catch (error: any) {
        logError("RAZORPAY_ORDER", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
