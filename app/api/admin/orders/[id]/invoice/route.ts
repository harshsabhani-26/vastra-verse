/**
 * Invoice API Route — Admin Only
 * POST /api/admin/orders/[id]/invoice
 * 
 * Modes:
 *   mode=download → returns PDF stream for auto-download
 *   mode=email    → sends invoice email to customer
 * 
 * Features:
 *   - Admin authentication required
 *   - Server-side PDF generation (PDFKit)
 *   - Audit logging
 *   - Error-safe responses
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateInvoicePDFBuffer } from "@/lib/invoice/generator";
import { sendInvoiceEmailWithPDF } from "@/lib/email/send-invoice";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ---- Auth ----
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // ---- Get mode from body or URL ----
        let mode = "download";
        try {
            const url = new URL(req.url);
            mode = url.searchParams.get("mode") || "download";
        } catch {
            // If URL parsing fails, try body
            try {
                const body = await req.clone().json();
                mode = body.mode || "download";
            } catch {
                mode = "download";
            }
        }

        // ---- Fetch Order ----
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                sku: true,
                            },
                        },
                    },
                },
                payments: {
                    select: {
                        id: true,
                        gatewayPaymentId: true,
                        method: true,
                        status: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                timeline: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // ---- Generate PDF ----
        const pdfBuffer = await generateInvoicePDFBuffer(order as any);

        // ---- Audit Log: INVOICE_GENERATED ----
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email || undefined,
                action: "INVOICE_GENERATED",
                description: `Invoice generated for order ${id}`,
                resourceType: "Order",
                resourceId: id,
                status: "SUCCESS",
            },
        });

        // =====================
        // MODE: DOWNLOAD
        // =====================
        if (mode === "download") {
            // Audit log: INVOICE_DOWNLOADED
            await prisma.activityLog.create({
                data: {
                    userId: session.user.id,
                    userEmail: session.user.email || undefined,
                    action: "INVOICE_DOWNLOADED",
                    description: `Invoice downloaded for order ${id}`,
                    resourceType: "Order",
                    resourceId: id,
                    status: "SUCCESS",
                },
            });

            // Add timeline entry
            await prisma.orderTimeline.create({
                data: {
                    orderId: id,
                    event: "Invoice Generated & Downloaded",
                    details: `Invoice PDF downloaded by admin`,
                    createdBy: session.user.id,
                },
            });

            // Return PDF response
            return new Response(new Uint8Array(pdfBuffer), {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
                    "Content-Length": String(pdfBuffer.length),
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                },
            });
        }

        // =====================
        // MODE: EMAIL
        // =====================
        if (mode === "email") {
            const customerEmail = order.user?.email;
            const customerName = order.customerName || order.user?.name || "Customer";

            if (!customerEmail) {
                return NextResponse.json(
                    { error: "Customer email not found" },
                    { status: 400 }
                );
            }

            const result = await sendInvoiceEmailWithPDF({
                to: customerEmail,
                orderId: order.id,
                customerName,
                pdfBuffer,
                orderTotal: Number(order.total).toLocaleString("en-IN"),
                paymentMethod: order.paymentMethod || "N/A",
            });

            if (result.success) {
                // Audit log: INVOICE_EMAILED
                await prisma.activityLog.create({
                    data: {
                        userId: session.user.id,
                        userEmail: session.user.email || undefined,
                        action: "INVOICE_EMAILED",
                        description: `Invoice emailed to ${customerEmail} for order ${id}`,
                        resourceType: "Order",
                        resourceId: id,
                        status: "SUCCESS",
                    },
                });

                // Timeline entry
                await prisma.orderTimeline.create({
                    data: {
                        orderId: id,
                        event: "Invoice Emailed",
                        details: `Invoice sent to ${customerEmail} by admin`,
                        createdBy: session.user.id,
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: `Invoice sent to ${customerEmail}`,
                    messageId: result.messageId,
                });
            } else {
                // Log failure
                await prisma.activityLog.create({
                    data: {
                        userId: session.user.id,
                        userEmail: session.user.email || undefined,
                        action: "INVOICE_EMAILED",
                        description: `Failed to email invoice for order ${id}: ${result.error}`,
                        resourceType: "Order",
                        resourceId: id,
                        status: "FAILED",
                        errorMessage: result.error,
                    },
                });

                return NextResponse.json(
                    { error: result.error || "Failed to send email" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: `Invalid mode: ${mode}. Use 'download' or 'email'.` },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("[Invoice API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
