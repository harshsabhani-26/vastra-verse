import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.create({
            amount: 8999 * 100, // amount in paise
            currency: "INR",
            receipt: "test_receipt_1",
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Razorpay error:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
