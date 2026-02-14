/**
 * Invoice API Route — Admin Only
 * POST /api/admin/orders/[id]/invoice?mode=download|email
 * 
 * Orchestrates the 3-layer invoice architecture:
 *   Layer 1: buildInvoiceData()  — fetch + calculate
 *   Layer 2: generateInvoicePDF() — render PDF
 *   Layer 3: sendInvoiceEmail()  — deliver email
 * 
 * Single DB fetch. Single PDF generation. Structured errors.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { buildInvoiceData, InvoiceError } from "@/lib/invoice-data-builder";
import { generateInvoicePDF } from "@/lib/invoice-pdf-generator";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ── 1. Auth ──
        let session;
        try {
            session = await requireAdmin();
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // ── 2. Parse mode ──
        let mode = "download";
        try {
            const url = new URL(req.url);
            mode = url.searchParams.get("mode") || "download";
        } catch {
            mode = "download";
        }

        if (mode !== "download" && mode !== "email") {
            return NextResponse.json(
                { error: `Invalid mode: ${mode}. Use 'download' or 'email'.` },
                { status: 400 }
            );
        }

        // ── 3. LAYER 1 — Build Invoice Data ──
        let invoiceData;
        try {
            invoiceData = await buildInvoiceData(id);
        } catch (err: any) {
            if (err instanceof InvoiceError && err.code === "ORDER_NOT_FOUND") {
                return NextResponse.json({ error: err.message }, { status: 404 });
            }
            console.error("[Invoice API] Data builder error:", err);
            return NextResponse.json(
                { error: "Failed to build invoice data", details: err.message },
                { status: 500 }
            );
        }

        // ── 4. LAYER 2 — Generate PDF ──
        let pdfBuffer: Buffer;
        try {
            pdfBuffer = await generateInvoicePDF(invoiceData);
        } catch (err: any) {
            console.error("[Invoice API] PDF generator error:", err);
            return NextResponse.json(
                { error: "Failed to generate invoice PDF", details: err.message },
                { status: 500 }
            );
        }

        // ── Non-blocking audit helper ──
        const logAudit = (action: string, description: string, status = "SUCCESS", errorMessage?: string) => {
            prisma.activityLog.create({
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
            }).catch((e) => console.error("[Invoice API] Audit log failed:", e));
        };

        const logTimeline = (event: string, details: string) => {
            prisma.orderTimeline.create({
                data: { orderId: id, event, details, createdBy: session.user?.id },
            }).catch((e) => console.error("[Invoice API] Timeline log failed:", e));
        };

        // ══════════════════
        // MODE: DOWNLOAD
        // ══════════════════
        if (mode === "download") {
            logAudit("INVOICE_DOWNLOADED", `Invoice ${invoiceData.invoiceNumber} downloaded for order ${id}`);
            logTimeline("Invoice Downloaded", `Invoice ${invoiceData.invoiceNumber} downloaded by admin`);

            return new Response(new Uint8Array(pdfBuffer), {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${invoiceData.invoiceNumber}.pdf"`,
                    "Content-Length": String(pdfBuffer.length),
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                },
            });
        }

        // ══════════════════
        // MODE: EMAIL
        // ══════════════════
        if (!invoiceData.customer.email) {
            return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
        }

        // ── 5. LAYER 3 — Send Email ──
        const result = await sendInvoiceEmail(invoiceData, pdfBuffer);

        if (result.success) {
            logAudit("INVOICE_EMAILED", `Invoice ${invoiceData.invoiceNumber} emailed to ${invoiceData.customer.email}`);
            logTimeline("Invoice Emailed", `Invoice sent to ${invoiceData.customer.email}`);

            return NextResponse.json({
                success: true,
                message: `Invoice sent to ${invoiceData.customer.email}`,
                invoiceNumber: invoiceData.invoiceNumber,
                messageId: result.messageId,
            });
        } else {
            logAudit("INVOICE_EMAILED", `Failed: ${result.error}`, "FAILED", result.error);

            return NextResponse.json(
                { error: result.error || "Failed to send email" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("[Invoice API] Unhandled error:", error?.message || error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
