/**
 * Invoice API Route — Admin Only
 * POST /api/admin/orders/[id]/invoice
 * 
 * Modes:
 *   mode=download → returns PDF stream for auto-download
 *   mode=email    → sends invoice email to customer
 * 
 * Features:
 *   - Admin authentication (email-based via ADMIN_EMAIL)
 *   - Server-side PDF generation (PDFKit)
 *   - Audit logging to ActivityLog
 *   - Error-safe responses
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { generateInvoicePDFBuffer } from "@/lib/invoice/generator";
import { sendInvoiceEmailWithPDF } from "@/lib/email/send-invoice";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ---- Auth (email-based admin check) ----
        let session;
        try {
            session = await requireAdmin();
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // ---- Get mode from URL ----
        let mode = "download";
        try {
            const url = new URL(req.url);
            mode = url.searchParams.get("mode") || "download";
        } catch {
            mode = "download";
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
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // ---- Generate PDF ----
        let pdfBuffer: Buffer;
        try {
            pdfBuffer = await generateInvoicePDFBuffer(order as any);
        } catch (pdfError: any) {
            console.error("[Invoice API] PDF generation failed:", pdfError);
            return NextResponse.json(
                { error: "Failed to generate invoice PDF", details: pdfError.message },
                { status: 500 }
            );
        }

        // ---- Audit Log (non-blocking, errors don't block response) ----
        const logAudit = async (action: string, description: string, status: string = "SUCCESS", errorMessage?: string) => {
            try {
                await prisma.activityLog.create({
                    data: {
                        userId: session.user?.id,
                        userEmail: session.user?.email || undefined,
                        action,
                        description,
                        resourceType: "Order",
                        resourceId: id,
                        status,
                        errorMessage,
                    },
                });
            } catch (logErr) {
                console.error("[Invoice API] Audit log failed:", logErr);
            }
        };

        const logTimeline = async (event: string, details: string) => {
            try {
                await prisma.orderTimeline.create({
                    data: {
                        orderId: id,
                        event,
                        details,
                        createdBy: session.user?.id,
                    },
                });
            } catch (logErr) {
                console.error("[Invoice API] Timeline log failed:", logErr);
            }
        };

        // =====================
        // MODE: DOWNLOAD
        // =====================
        if (mode === "download") {
            // Non-blocking audit + timeline
            logAudit("INVOICE_DOWNLOADED", `Invoice downloaded for order ${id}`);
            logTimeline("Invoice Downloaded", "Invoice PDF downloaded by admin");

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
                logAudit("INVOICE_EMAILED", `Invoice emailed to ${customerEmail} for order ${id}`);
                logTimeline("Invoice Emailed", `Invoice sent to ${customerEmail} by admin`);

                return NextResponse.json({
                    success: true,
                    message: `Invoice sent to ${customerEmail}`,
                    messageId: result.messageId,
                });
            } else {
                logAudit("INVOICE_EMAILED", `Failed to email invoice for order ${id}: ${result.error}`, "FAILED", result.error);

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
        console.error("[Invoice API] Unhandled error:", error?.message || error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
