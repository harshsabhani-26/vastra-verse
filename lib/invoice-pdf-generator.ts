/**
 * LAYER 2 — Invoice PDF Generator
 * 
 * Single responsibility: render a professional branded invoice PDF.
 * Takes InvoiceData object from Layer 1, returns Buffer.
 * NO database calls. NO email logic.
 */

import PDFDocument from "pdfkit";
import type { InvoiceData } from "@/lib/invoice-data-builder";

// ─── Formatting ──────────────────────────────────────────────────────────────

function currency(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function line(doc: PDFKit.PDFDocument, y: number, x1: number = 40, x2: number = 555) {
    doc.strokeColor("#e0e0e0").lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_W = 595.28; // A4
const L = 40;          // left margin
const R = 555;         // right margin
const CW = R - L;      // content width
const BRAND_COLOR = "#1a4d3a";
const BRAND_LIGHT = "#c0d8c0";

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: L,
                bufferPages: true,
                info: {
                    Title: `Invoice ${data.invoiceNumber}`,
                    Author: data.store.brandName,
                    Subject: `Invoice for Order ${data.orderId}`,
                },
            });

            const chunks: Uint8Array[] = [];
            doc.on("data", (c: Uint8Array) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            let y = 0;

            // ═══════════════════════════════════════════
            // HEADER BAR
            // ═══════════════════════════════════════════
            doc.rect(0, 0, PAGE_W, 80).fill(BRAND_COLOR);

            // Brand name + tagline
            doc.fontSize(22).fillColor("#ffffff").font("Helvetica-Bold");
            doc.text(data.store.brandName.toUpperCase(), L, 18, { width: 300 });
            doc.fontSize(9).fillColor(BRAND_LIGHT).font("Helvetica");
            doc.text(data.store.tagline, L, 44);

            // Invoice label + number
            doc.fontSize(18).fillColor("#ffffff").font("Helvetica-Bold");
            doc.text("TAX INVOICE", R - 200, 18, { width: 200, align: "right" });
            doc.fontSize(9).fillColor(BRAND_LIGHT).font("Helvetica");
            doc.text(data.invoiceNumber, R - 200, 44, { width: 200, align: "right" });

            // ═══════════════════════════════════════════
            // META ROW
            // ═══════════════════════════════════════════
            y = 95;
            const metaCols = [
                { label: "Invoice Date", value: formatDate(data.invoiceDate) },
                { label: "Order Date", value: formatDate(data.orderDate) },
                { label: "Order ID", value: data.orderId.length > 12 ? data.orderId.slice(0, 12) + "…" : data.orderId },
                { label: "Payment", value: data.payment.method },
            ];
            const metaW = CW / metaCols.length;

            metaCols.forEach((col, i) => {
                const x = L + i * metaW;
                doc.fontSize(7).fillColor("#999999").font("Helvetica").text(col.label, x, y);
                doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold").text(col.value, x, y + 11);
            });

            y += 28;
            line(doc, y);

            // ═══════════════════════════════════════════
            // SELLER / BILL TO / SHIP TO
            // ═══════════════════════════════════════════
            y += 12;
            const colW = CW / 3;
            const sections = [
                {
                    header: "SOLD BY",
                    line1: data.store.businessName,
                    line2: `${data.store.address}\n${data.store.city}, ${data.store.state} - ${data.store.zipCode}`,
                    line3: `GSTIN: ${data.tax.gstin}`,
                },
                {
                    header: "BILL TO",
                    line1: data.customer.name,
                    line2: data.billingAddress.fullAddress,
                    line3: `Phone: ${data.customer.phone || "-"}`,
                },
                {
                    header: "SHIP TO",
                    line1: data.customer.name,
                    line2: data.shippingAddress.fullAddress,
                    line3: data.customer.email ? `Email: ${data.customer.email}` : "",
                },
            ];

            // Headers
            sections.forEach((s, i) => {
                doc.fontSize(7).fillColor("#999999").font("Helvetica");
                doc.text(s.header, L + i * colW, y);
            });

            y += 11;
            sections.forEach((s, i) => {
                const x = L + i * colW;
                doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold");
                doc.text(s.line1, x, y, { width: colW - 12 });
            });

            y += 14;
            const addressStartY = y;
            let maxAddressH = 0;
            sections.forEach((s, i) => {
                const x = L + i * colW;
                doc.fontSize(8).fillColor("#555555").font("Helvetica");
                doc.text(s.line2, x, addressStartY, { width: colW - 12 });
                const h = doc.heightOfString(s.line2, { width: colW - 12 });
                if (h > maxAddressH) maxAddressH = h;
            });

            y = addressStartY + maxAddressH + 4;
            sections.forEach((s, i) => {
                if (s.line3) {
                    doc.fontSize(7).fillColor("#888888").font("Helvetica");
                    doc.text(s.line3, L + i * colW, y, { width: colW - 12 });
                }
            });

            y += 16;
            line(doc, y);

            // ═══════════════════════════════════════════
            // ITEMS TABLE
            // ═══════════════════════════════════════════
            y += 10;

            // Column positions
            const cols = {
                product: L,
                hsn: L + 180,
                qty: L + 240,
                unitPrice: L + 280,
                taxable: L + 350,
                tax: L + 420,
                total: L + 475,
            };

            // Table header background
            doc.rect(L, y - 4, CW, 18).fill("#f5f5f0");

            doc.fontSize(7).fillColor("#666666").font("Helvetica-Bold");
            doc.text("PRODUCT", cols.product + 4, y);
            doc.text("HSN", cols.hsn, y);
            doc.text("QTY", cols.qty, y, { width: 30, align: "center" });
            doc.text("UNIT PRICE", cols.unitPrice, y, { width: 60, align: "right" });
            doc.text("TAXABLE", cols.taxable, y, { width: 60, align: "right" });
            doc.text("TAX", cols.tax, y, { width: 45, align: "right" });
            doc.text("TOTAL", cols.total, y, { width: 50, align: "right" });

            y += 20;

            // Table rows
            for (const item of data.items) {
                if (y > 700) {
                    doc.addPage();
                    y = 40;
                }

                doc.font("Helvetica").fontSize(8).fillColor("#333333");
                doc.text(item.name, cols.product + 4, y, { width: 170 });
                doc.fontSize(7).fillColor("#888888");
                doc.text(item.hsnCode, cols.hsn, y);
                doc.fillColor("#333333").fontSize(8);
                doc.text(String(item.quantity), cols.qty, y, { width: 30, align: "center" });
                doc.text(currency(item.unitPrice), cols.unitPrice, y, { width: 60, align: "right" });
                doc.text(currency(item.taxableValue), cols.taxable, y, { width: 60, align: "right" });
                doc.fontSize(7).fillColor("#888888");
                doc.text(currency(item.taxAmount), cols.tax, y, { width: 45, align: "right" });
                doc.font("Helvetica-Bold").fontSize(8).fillColor("#333333");
                doc.text(currency(item.lineTotal), cols.total, y, { width: 50, align: "right" });

                y += 18;
                line(doc, y - 4, L, R);
            }

            // ═══════════════════════════════════════════
            // TOTALS SECTION
            // ═══════════════════════════════════════════
            y += 8;
            const totX = R - 210;
            const valX = R - 65;

            const addRow = (label: string, value: string, bold = false, highlight = false) => {
                if (bold) {
                    doc.font("Helvetica-Bold").fontSize(10).fillColor(highlight ? BRAND_COLOR : "#333333");
                } else {
                    doc.font("Helvetica").fontSize(8).fillColor("#555555");
                }
                doc.text(label, totX, y, { width: 140 });
                doc.text(value, valX, y, { width: 70, align: "right" });
                y += bold ? 18 : 14;
            };

            const t = data.totals;
            addRow("Subtotal (excl. tax)", currency(t.subtotal));

            if (t.taxBreakdown.taxType === "CGST_SGST") {
                addRow(`CGST @ ${data.tax.cgstRate}%`, currency(t.taxBreakdown.cgst));
                addRow(`SGST @ ${data.tax.sgstRate}%`, currency(t.taxBreakdown.sgst));
            } else {
                addRow(`IGST @ ${data.tax.igstRate}%`, currency(t.taxBreakdown.igst));
            }

            if (t.shippingCharges > 0) addRow("Shipping", currency(t.shippingCharges));
            if (t.discount > 0) addRow("Discount", `- ${currency(t.discount)}`);
            if (t.giftWrapCharge > 0) addRow("Gift Wrap", currency(t.giftWrapCharge));

            line(doc, y - 4, totX, R);
            y += 4;
            addRow("GRAND TOTAL", currency(t.grandTotal), true, true);

            // ═══════════════════════════════════════════
            // PAYMENT STATUS BOX
            // ═══════════════════════════════════════════
            y += 8;
            const payColor = data.payment.status === "PAID" ? "#16a34a" : "#dc2626";

            doc.roundedRect(L, y, 180, 32, 4).fill("#f9fafb").stroke("#e5e7eb");
            doc.fontSize(7).fillColor("#888888").font("Helvetica").text("PAYMENT STATUS", L + 10, y + 6);
            doc.fontSize(10).fillColor(payColor).font("Helvetica-Bold").text(data.payment.status, L + 10, y + 18);

            if (data.payment.transactionId) {
                doc.roundedRect(L + 190, y, 200, 32, 4).fill("#f9fafb").stroke("#e5e7eb");
                doc.fontSize(7).fillColor("#888888").font("Helvetica").text("TRANSACTION ID", L + 200, y + 6);
                doc.fontSize(8).fillColor("#333333").font("Helvetica").text(data.payment.transactionId, L + 200, y + 18, { width: 180 });
            }

            // ═══════════════════════════════════════════
            // FOOTER
            // ═══════════════════════════════════════════
            y += 50;
            if (y > 720) { doc.addPage(); y = 40; }

            line(doc, y);
            y += 10;

            doc.fontSize(7).fillColor("#999999").font("Helvetica");
            doc.text(
                "This is a computer-generated invoice. No signature is required.",
                L, y, { width: CW, align: "center" }
            );
            y += 10;
            doc.text(
                "Terms: All sales are subject to our terms and conditions. Returns accepted within 7 days of delivery.",
                L, y, { width: CW, align: "center" }
            );
            y += 10;
            doc.text(
                `For queries: ${data.store.supportEmail} | ${data.store.supportPhone}`,
                L, y, { width: CW, align: "center" }
            );

            // Brand footer
            y += 18;
            doc.fontSize(8).fillColor(BRAND_COLOR).font("Helvetica-Bold");

            const footerText = data.store.businessName === data.store.brandName
                ? data.store.brandName
                : `${data.store.businessName} — ${data.store.brandName}`;

            doc.text(footerText, L, y, {
                width: CW,
                align: "center",
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
