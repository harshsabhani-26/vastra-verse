import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, currency = "INR", receipt } = body;

        if (process.env.NODE_ENV === "development") {
            console.log("Creating Razorpay order:", { amount, currency, receipt });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay credentials missing");
            return NextResponse.json({ error: "Razorpay credentials missing" }, { status: 500 });
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

        if (process.env.NODE_ENV === "development") {
            console.log("Razorpay order created successfully:", order);
        }
        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        console.error("Error details:", {
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
