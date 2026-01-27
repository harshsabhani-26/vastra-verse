import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Check if user is admin
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch Order
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Generate Invoice
        const pdfBuffer = await generateInvoicePDF(order);

        // Send Email
        const customerEmail = order.user?.email; // Or order.customerEmail if you had a guest checkout field
        const customerName = order.customerName || order.user?.name || "Customer";

        if (!customerEmail) {
            return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
        }

        const emailSent = await sendInvoiceEmail(customerEmail, order.id, customerName, pdfBuffer);

        if (emailSent) {
            await prisma.orderTimeline.create({
                data: {
                    orderId: id,
                    event: "Invoice Manually Sent",
                    details: `Invoice emailed to ${customerEmail} by Admin`,
                    createdBy: session.user.id
                }
            });
            return NextResponse.json({ success: true, message: "Invoice sent successfully" });
        } else {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }

    } catch (error) {
        console.error("Manual Invoice generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
