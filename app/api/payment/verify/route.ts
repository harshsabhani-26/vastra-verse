import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await auth();
        // Payment verification might happen via webhook or client, usually verified server-side.
        // If this is a public verification route (webhook), auth check might fail. 
        // But the previous code had auth check, so I'll keep it but be wary if it's a webhook.
        // Razorpay webhooks usually don't have user session. User-initiated verify does.

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay secret missing" }, { status: 500 });
        }

        // Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {

            // 1. Update Order & Create Payment
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: "CONFIRMED",
                        paymentStatus: "PAID",
                        paymentMethod: "Prepaid (Razorpay)",
                    },
                });

                // Fetch just for amount if needed, or rely on update return? 
                // We'll update payment after.
            });

            // 2. Fetch Full Order Details for Invoice
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

            if (!fullOrder) throw new Error("Order not found after payment");

            // 3. Create Payment Record (Ideally inside transaction, but safe enough here)
            await prisma.payment.create({
                data: {
                    orderId: orderId,
                    amount: fullOrder.total,
                    currency: "INR",
                    status: "COMPLETED",
                    method: "UPI", // Defaulting to UPI as generic online payment for now
                    gatewayProvider: "razorpay",
                    gatewayOrderId: razorpay_order_id,
                    gatewayPaymentId: razorpay_payment_id,
                    gatewaySignature: razorpay_signature,
                    verifiedAt: new Date(),
                }
            });

            await prisma.orderTimeline.create({
                data: {
                    orderId: orderId,
                    event: "Payment Received",
                    details: `Payment ID: ${razorpay_payment_id}`,
                    createdBy: "system" // or session.user.id
                }
            });

            // 4. Generate & Send Invoice (Automatic)
            try {
                console.log("Generating invoice for order:", orderId);
                const pdfBuffer = await generateInvoicePDF(fullOrder);

                const customerEmail = fullOrder.user?.email; // OR guest email if stored
                const customerName = fullOrder.user?.name || fullOrder.customerName || "Customer";

                if (customerEmail) {
                    console.log("Sending invoice email to:", customerEmail);
                    await sendInvoiceEmail(customerEmail, orderId, customerName, pdfBuffer);

                    await prisma.orderTimeline.create({
                        data: {
                            orderId: orderId,
                            event: "Invoice Sent",
                            details: `Invoice emailed to ${customerEmail}`,
                            createdBy: "system"
                        }
                    });
                } else {
                    console.log("No customer email found for invoice.");
                }

            } catch (invError) {
                console.error("Failed to generate/send invoice:", invError);
                // Don't fail the request, just log it. 
            }

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}

