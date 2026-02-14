/**
 * Server-side Invoice PDF Generator using PDFKit
 * Generates professional invoices with GST fields, branding, and legal footer
 * Never runs on client — always server-side
 */

import PDFDocument from "pdfkit";

export interface InvoiceOrderItem {
    id: string;
    quantity: number;
    price: string;
    product: {
        id: string;
        name: string;
        price: string;
        sku?: string | null;
    };
}

export interface InvoiceOrder {
    id: string;
    createdAt: Date | string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    total: any; // Decimal
    subtotal: any;
    cgst: any;
    sgst: any;
    igst: any;
    gstRate: any;
    shippingCharges: any;
    discount: any;
    giftWrapCharge: any;
    giftWrapEnabled: boolean;
    shippingAddress: string | null;
    shippingState: string | null;
    customerName: string | null;
    customerPhone: string | null;
    trackingNumber: string | null;
    courierName: string | null;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
    };
    items: InvoiceOrderItem[];
    payments?: {
        id: string;
        gatewayPaymentId: string | null;
        method: string;
        status: string;
    }[];
}

/**
 * Generate invoice number in format INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(orderId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const suffix = orderId.slice(-4).toUpperCase();
    return `INV-${year}${month}${day}-${suffix}`;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Draw a horizontal line
 */
function drawLine(doc: PDFKit.PDFDocument, y: number, left: number = 40, right: number = 555) {
    doc.strokeColor("#e0e0e0").lineWidth(0.5).moveTo(left, y).lineTo(right, y).stroke();
}

/**
 * Generate a professional invoice PDF buffer using PDFKit
 */
export async function generateInvoicePDFBuffer(order: InvoiceOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 40,
                bufferPages: true,
                info: {
                    Title: `Invoice - ${order.id}`,
                    Author: "Vastra Verse",
                    Subject: `Invoice for Order ${order.id}`,
                },
            });

            const chunks: Uint8Array[] = [];
            doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const pageWidth = 595.28; // A4 width in points
            const leftMargin = 40;
            const rightMargin = 555;
            const contentWidth = rightMargin - leftMargin;

            const invoiceNumber = generateInvoiceNumber(order.id);
            const orderDate = new Date(order.createdAt);
            const invoiceDate = new Date();

            // =====================
            // HEADER
            // =====================
            // Brand bar
            doc.rect(0, 0, pageWidth, 80).fill("#1a4d3a");

            // Brand name
            doc.fontSize(22).fillColor("#ffffff").font("Helvetica-Bold");
            doc.text("VASTRA VERSE", leftMargin, 20, { width: 300 });
            doc.fontSize(9).fillColor("#c0d8c0").font("Helvetica");
            doc.text("Premium Indian Textiles & Sarees", leftMargin, 45);

            // Invoice label
            doc.fontSize(18).fillColor("#ffffff").font("Helvetica-Bold");
            doc.text("TAX INVOICE", rightMargin - 200, 20, { width: 200, align: "right" });
            doc.fontSize(9).fillColor("#c0d8c0").font("Helvetica");
            doc.text(invoiceNumber, rightMargin - 200, 45, { width: 200, align: "right" });

            // =====================
            // INVOICE META
            // =====================
            let y = 95;

            doc.fontSize(8).fillColor("#888888").font("Helvetica");
            doc.text("Invoice Date", leftMargin, y);
            doc.text("Order Date", leftMargin + 130, y);
            doc.text("Order ID", leftMargin + 260, y);
            doc.text("Payment Method", leftMargin + 390, y);

            y += 12;
            doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold");
            doc.text(invoiceDate.toLocaleDateString("en-IN"), leftMargin, y);
            doc.text(orderDate.toLocaleDateString("en-IN"), leftMargin + 130, y);
            doc.text(order.id.slice(0, 12) + "...", leftMargin + 260, y);
            doc.text(order.paymentMethod || "N/A", leftMargin + 390, y);

            y += 6;
            drawLine(doc, y + 10);

            // =====================
            // SOLD BY + BILL TO + SHIP TO
            // =====================
            y += 20;
            const colWidth = contentWidth / 3;

            // Headers
            doc.fontSize(8).fillColor("#888888").font("Helvetica");
            doc.text("SOLD BY", leftMargin, y);
            doc.text("BILL TO", leftMargin + colWidth, y);
            doc.text("SHIP TO", leftMargin + colWidth * 2, y);

            y += 12;
            doc.fillColor("#333333").font("Helvetica-Bold").fontSize(9);
            doc.text("M & H Silk Heritage", leftMargin, y, { width: colWidth - 10 });

            const customerName = order.customerName || order.user?.name || "Customer";
            doc.text(customerName, leftMargin + colWidth, y, { width: colWidth - 10 });
            doc.text(customerName, leftMargin + colWidth * 2, y, { width: colWidth - 10 });

            y += 14;
            doc.font("Helvetica").fontSize(8).fillColor("#555555");
            doc.text("123 Silk Street, Heritage City,\nGujarat, India - 395006", leftMargin, y, { width: colWidth - 10 });

            const address = order.shippingAddress || "No address provided";
            doc.text(address, leftMargin + colWidth, y, { width: colWidth - 10 });
            doc.text(address, leftMargin + colWidth * 2, y, { width: colWidth - 10 });

            // Calculate how many lines the address took
            const addressLines = Math.max(
                doc.heightOfString(address, { width: colWidth - 10 }),
                doc.heightOfString("123 Silk Street, Heritage City,\nGujarat, India - 395006", { width: colWidth - 10 })
            );
            y += addressLines + 4;

            // Phone
            const phone = order.customerPhone || order.user?.phone || "-";
            doc.text(`Phone: ${phone}`, leftMargin + colWidth, y, { width: colWidth - 10 });
            doc.text(`Phone: ${phone}`, leftMargin + colWidth * 2, y, { width: colWidth - 10 });

            y += 12;
            // GSTIN
            doc.fontSize(7).fillColor("#888888");
            doc.text("GSTIN: 24AABCO4794P1ZN", leftMargin, y);

            // Email
            const email = order.user?.email || "-";
            doc.text(`Email: ${email}`, leftMargin + colWidth, y);

            y += 14;
            drawLine(doc, y);

            // =====================
            // ITEMS TABLE
            // =====================
            y += 12;

            // Table header
            const tableLeft = leftMargin;
            const colProduct = tableLeft;
            const colSKU = tableLeft + 200;
            const colQty = tableLeft + 280;
            const colUnitPrice = tableLeft + 320;
            const colTax = tableLeft + 400;
            const colTotal = tableLeft + 460;

            doc.rect(tableLeft, y - 4, contentWidth, 18).fill("#f5f5f0");

            doc.fontSize(7).fillColor("#666666").font("Helvetica-Bold");
            doc.text("PRODUCT", colProduct + 4, y);
            doc.text("SKU", colSKU, y);
            doc.text("QTY", colQty, y, { align: "center", width: 30 });
            doc.text("UNIT PRICE", colUnitPrice, y, { width: 70, align: "right" });
            doc.text("TAX", colTax, y, { width: 50, align: "right" });
            doc.text("TOTAL", colTotal, y, { width: 55, align: "right" });

            y += 20;

            // Table rows
            const gstRate = Number(order.gstRate) || 18;

            let itemsSubtotal = 0;
            let totalTaxAmount = 0;

            for (const item of order.items) {
                const qty = item.quantity;
                const unitPrice = Number(item.price);
                const lineTotal = unitPrice * qty;

                // Back-calculate tax from inclusive price
                const taxablePerUnit = unitPrice / (1 + gstRate / 100);
                const taxPerUnit = unitPrice - taxablePerUnit;
                const lineTax = taxPerUnit * qty;
                const lineTaxable = taxablePerUnit * qty;

                itemsSubtotal += lineTaxable;
                totalTaxAmount += lineTax;

                // Check if we need a new page
                if (y > 700) {
                    doc.addPage();
                    y = 40;
                }

                doc.font("Helvetica").fontSize(8).fillColor("#333333");
                doc.text(item.product.name, colProduct + 4, y, { width: 190 });
                doc.fontSize(7).fillColor("#888888");
                doc.text(item.product.sku || "-", colSKU, y);
                doc.fillColor("#333333").fontSize(8);
                doc.text(String(qty), colQty, y, { align: "center", width: 30 });
                doc.text(formatCurrency(unitPrice), colUnitPrice, y, { width: 70, align: "right" });
                doc.text(formatCurrency(lineTax), colTax, y, { width: 50, align: "right" });
                doc.font("Helvetica-Bold");
                doc.text(formatCurrency(lineTotal), colTotal, y, { width: 55, align: "right" });

                y += 18;
                drawLine(doc, y - 4, tableLeft, rightMargin);
            }

            // =====================
            // TOTALS SECTION
            // =====================
            y += 10;

            const totalsX = rightMargin - 200;
            const totalsValueX = rightMargin - 60;

            const subtotal = Number(order.subtotal) || itemsSubtotal;
            const cgst = Number(order.cgst) || 0;
            const sgst = Number(order.sgst) || 0;
            const igst = Number(order.igst) || 0;
            const shipping = Number(order.shippingCharges) || 0;
            const discount = Number(order.discount) || 0;
            const giftWrap = order.giftWrapEnabled ? (Number(order.giftWrapCharge) || 0) : 0;
            const total = Number(order.total);

            doc.font("Helvetica").fontSize(8).fillColor("#555555");

            const addTotalLine = (label: string, value: string, bold = false) => {
                if (bold) {
                    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a4d3a");
                } else {
                    doc.font("Helvetica").fontSize(8).fillColor("#555555");
                }
                doc.text(label, totalsX, y, { width: 130 });
                doc.text(value, totalsValueX, y, { width: 60, align: "right" });
                y += bold ? 18 : 14;
            };

            addTotalLine("Subtotal (excl. tax)", formatCurrency(subtotal));
            if (cgst > 0) addTotalLine(`CGST (${gstRate / 2}%)`, formatCurrency(cgst));
            if (sgst > 0) addTotalLine(`SGST (${gstRate / 2}%)`, formatCurrency(sgst));
            if (igst > 0) addTotalLine(`IGST (${gstRate}%)`, formatCurrency(igst));
            if (shipping > 0) addTotalLine("Shipping", formatCurrency(shipping));
            if (discount > 0) addTotalLine("Discount", `- ${formatCurrency(discount)}`);
            if (giftWrap > 0) addTotalLine("Gift Wrap", formatCurrency(giftWrap));

            drawLine(doc, y - 4, totalsX, rightMargin);
            y += 4;
            addTotalLine("GRAND TOTAL", formatCurrency(total), true);

            // =====================
            // PAYMENT STATUS BOX
            // =====================
            y += 10;
            const paymentColor = order.paymentStatus === "PAID" ? "#16a34a" : "#dc2626";
            doc.roundedRect(leftMargin, y, 180, 30, 4).fill("#f9fafb").stroke("#e5e7eb");
            doc.fontSize(7).fillColor("#888888").font("Helvetica");
            doc.text("PAYMENT STATUS", leftMargin + 10, y + 6);
            doc.fontSize(10).fillColor(paymentColor).font("Helvetica-Bold");
            doc.text(order.paymentStatus, leftMargin + 10, y + 16);

            // Transaction ID if available
            if (order.payments && order.payments.length > 0) {
                const payment = order.payments[0];
                if (payment.gatewayPaymentId) {
                    doc.roundedRect(leftMargin + 190, y, 180, 30, 4).fill("#f9fafb").stroke("#e5e7eb");
                    doc.fontSize(7).fillColor("#888888").font("Helvetica");
                    doc.text("TRANSACTION ID", leftMargin + 200, y + 6);
                    doc.fontSize(8).fillColor("#333333").font("Helvetica");
                    doc.text(payment.gatewayPaymentId, leftMargin + 200, y + 17);
                }
            }

            // =====================
            // LEGAL FOOTER
            // =====================
            y += 50;

            if (y > 720) {
                doc.addPage();
                y = 40;
            }

            drawLine(doc, y);
            y += 10;

            doc.fontSize(7).fillColor("#999999").font("Helvetica");
            doc.text(
                "This is a computer-generated invoice. No signature is required.",
                leftMargin,
                y,
                { width: contentWidth, align: "center" }
            );
            y += 10;
            doc.text(
                "Terms: All sales are subject to our terms and conditions. Returns accepted within 7 days of delivery.",
                leftMargin,
                y,
                { width: contentWidth, align: "center" }
            );
            y += 10;
            doc.text(
                "For any queries, contact us at support@vastraverse.in | +91-XXXXXXXXXX",
                leftMargin,
                y,
                { width: contentWidth, align: "center" }
            );

            // Brand footer
            y += 20;
            doc.fontSize(8).fillColor("#1a4d3a").font("Helvetica-Bold");
            doc.text("M & H Silk Heritage — Vastra Verse", leftMargin, y, {
                width: contentWidth,
                align: "center",
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
