import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            console.error("Razorpay API: Unauthorized access attempt");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { amount, currency = "INR", receipt, notes } = body;

        // Detailed Logging
        console.log("Razorpay Order Request:", {
            amount,
            currency,
            receipt,
            hasKeyId: !!process.env.RAZORPAY_KEY_ID,
            hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
        });

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay keys are missing in environment variables");
            return NextResponse.json(
                { error: "Payment configuration error: Missing keys" },
                { status: 500 }
            );
        }

        if (!amount || amount < 1) {
            console.error("Razorpay API: Invalid amount", amount);
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
            notes,
        };

        const order = await razorpay.orders.create(options);
        console.log("Razorpay Order Created:", order.id);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay order creation error:", {
            message: error.message,
            error: error
        });
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}

