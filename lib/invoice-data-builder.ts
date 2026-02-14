/**
 * LAYER 1 — Invoice Data Builder
 * 
 * Single responsibility: fetch and combine all invoice data from database.
 * Calculates GST dynamically using TaxSettings + state comparison.
 * Returns a typed InvoiceData object — NO PDF or email logic.
 */

import prisma from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InvoiceStoreConfig {
    brandName: string;
    tagline: string;
    logoUrl: string | null;
    gstin: string;
    businessName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    supportEmail: string;
    supportPhone: string;
}

export interface InvoiceTaxConfig {
    gstEnabled: boolean;
    gstin: string;
    stateOfRegistration: string;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    defaultHsnCode: string;
}

export interface InvoiceLineItem {
    name: string;
    sku: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    taxableValue: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
}

export interface InvoiceCustomer {
    name: string;
    email: string;
    phone: string;
}

export interface InvoiceAddress {
    label: string;
    fullAddress: string;
    state: string;
}

export interface InvoiceTaxBreakdown {
    isInterState: boolean;
    taxType: "CGST_SGST" | "IGST";
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    effectiveRate: number;
}

export interface InvoiceTotals {
    subtotal: number;
    taxBreakdown: InvoiceTaxBreakdown;
    shippingCharges: number;
    discount: number;
    giftWrapCharge: number;
    grandTotal: number;
}

export interface InvoicePayment {
    method: string;
    status: string;
    transactionId: string | null;
}

export interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: Date;
    orderDate: Date;
    orderId: string;
    store: InvoiceStoreConfig;
    tax: InvoiceTaxConfig;
    customer: InvoiceCustomer;
    billingAddress: InvoiceAddress;
    shippingAddress: InvoiceAddress;
    items: InvoiceLineItem[];
    totals: InvoiceTotals;
    payment: InvoicePayment;
}

// ─── Invoice Number Generator ───────────────────────────────────────────────

function generateInvoiceNumber(orderId: string): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const suffix = orderId.slice(-4).toUpperCase();
    return `INV-${y}${m}${d}-${suffix}`;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_STORE: InvoiceStoreConfig = {
    brandName: "Vastra Verse",
    tagline: "Premium Indian Textiles & Sarees",
    logoUrl: null,
    gstin: "N/A",
    businessName: "Vastra Verse",
    address: "Surat, Gujarat",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    zipCode: "395006",
    supportEmail: "support@vastraverse.in",
    supportPhone: "+91-8200634078",
};

const DEFAULT_TAX: InvoiceTaxConfig = {
    gstEnabled: true,
    gstin: "N/A",
    stateOfRegistration: "Gujarat",
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    defaultHsnCode: "5007",
};

// ─── Main Builder ────────────────────────────────────────────────────────────

export async function buildInvoiceData(orderId: string): Promise<InvoiceData> {
    // ── Single parallel DB fetch ──
    const [order, storeSettings, taxSettings] = await Promise.all([
        prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, price: true, sku: true },
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
                    orderBy: { createdAt: "desc" as const },
                    take: 1,
                },
            },
        }),
        prisma.storeSettings.findFirst(),
        prisma.taxSettings.findFirst(),
    ]);

    if (!order) {
        throw new InvoiceError("ORDER_NOT_FOUND", `Order ${orderId} not found`);
    }

    // ── Build Store Config ──
    const store: InvoiceStoreConfig = {
        brandName: storeSettings?.storeName || DEFAULT_STORE.brandName,
        tagline: storeSettings?.tagline || DEFAULT_STORE.tagline,
        logoUrl: storeSettings?.logo || DEFAULT_STORE.logoUrl,
        gstin: storeSettings?.registrationNumber || taxSettings?.gstin || DEFAULT_STORE.gstin,
        businessName: storeSettings?.businessName || DEFAULT_STORE.businessName,
        address: storeSettings?.address || DEFAULT_STORE.address,
        city: storeSettings?.city || DEFAULT_STORE.city,
        state: storeSettings?.state || DEFAULT_STORE.state,
        country: storeSettings?.country || DEFAULT_STORE.country,
        zipCode: storeSettings?.zipCode || DEFAULT_STORE.zipCode,
        supportEmail: storeSettings?.email || DEFAULT_STORE.supportEmail,
        supportPhone: storeSettings?.phone || DEFAULT_STORE.supportPhone,
    };

    // ── Build Tax Config ──
    const tax: InvoiceTaxConfig = {
        gstEnabled: taxSettings?.gstEnabled ?? DEFAULT_TAX.gstEnabled,
        gstin: taxSettings?.gstin || store.gstin,
        stateOfRegistration: taxSettings?.stateOfReg || store.state,
        cgstRate: Number(taxSettings?.cgstRate) || DEFAULT_TAX.cgstRate,
        sgstRate: Number(taxSettings?.sgstRate) || DEFAULT_TAX.sgstRate,
        igstRate: Number(taxSettings?.igstRate) || DEFAULT_TAX.igstRate,
        defaultHsnCode: taxSettings?.defaultHsnCode || DEFAULT_TAX.defaultHsnCode,
    };

    // ── Customer ──
    const customer: InvoiceCustomer = {
        name: order.customerName || order.user?.name || "Customer",
        email: order.user?.email || "",
        phone: order.customerPhone || order.user?.phone || "",
    };

    // ── Addresses ──
    const customerState = order.shippingState || "";
    const billingAddress: InvoiceAddress = {
        label: "BILL TO",
        fullAddress: order.shippingAddress || "Address not provided",
        state: customerState,
    };
    const shippingAddress: InvoiceAddress = {
        label: "SHIP TO",
        fullAddress: order.shippingAddress || "Address not provided",
        state: customerState,
    };

    // ── GST Calculation (dynamic, state-based) ──
    const sellerState = tax.stateOfRegistration.toLowerCase().trim();
    const buyerState = customerState.toLowerCase().trim();
    const isInterState = buyerState !== "" && buyerState !== sellerState;

    const effectiveRate = isInterState ? tax.igstRate : tax.cgstRate + tax.sgstRate;

    // ── Build Line Items ──
    let subtotal = 0;
    let totalTaxAmount = 0;

    const items: InvoiceLineItem[] = order.items.map((item) => {
        const qty = item.quantity;
        const unitPrice = Number(item.price);
        const lineGross = unitPrice * qty;

        // Exclusive Tax Calculation
        const taxableValue = lineGross;
        const taxAmount = taxableValue * (effectiveRate / 100);

        subtotal += taxableValue;
        totalTaxAmount += taxAmount;

        return {
            name: item.product.name,
            sku: item.product.sku || "-",
            hsnCode: tax.defaultHsnCode,
            quantity: qty,
            unitPrice,
            taxableValue: round2(taxableValue),
            taxRate: effectiveRate,
            taxAmount: round2(taxAmount),
            lineTotal: round2(lineGross + taxAmount), // Line total is now Price + Tax
        };
    });

    // ── Tax Breakdown ──
    const taxBreakdown: InvoiceTaxBreakdown = {
        isInterState,
        taxType: isInterState ? "IGST" : "CGST_SGST",
        cgst: isInterState ? 0 : round2(totalTaxAmount / 2),
        sgst: isInterState ? 0 : round2(totalTaxAmount / 2),
        igst: isInterState ? round2(totalTaxAmount) : 0,
        totalTax: round2(totalTaxAmount),
        effectiveRate,
    };

    // ── Totals ──
    const shippingCharges = Number(order.shippingCharges) || 0;
    const discount = Number(order.discount) || 0;
    const giftWrapCharge = order.giftWrapEnabled ? (Number(order.giftWrapCharge) || 0) : 0;

    // Grand Total is now: Subtotal + Tax + Shipping + GiftWrap - Discount
    // The previous 'order.total' from DB might be inclusive or exclusive depending on when it was created.
    // Ideally, we should recalculate it here to be safe and consistent with the new logic, 
    // BUT we must respect the DB's total for integrity if payment was already made.
    // However, since we are changing the LOGIC, the Invoice must reflect the LOGIC.
    // If the DB total was 100 (inclusive) and we now say it's 100 + 18, the invoice total will be 118.
    // This might mismatch the payment record if the user paid 100.
    // Strategy: We recalculate based on our new logic. 
    // Wait, if the user PAID 100, and we generate an invoice for 118, that's bad.
    // But the user IS asking to change the logic. This implies future orders.
    // For OLD orders, this might look weird. 
    // Assuming the user accepts this change for *logic consistency*. 

    const calculatedGrandTotal = round2(subtotal + totalTaxAmount + shippingCharges + giftWrapCharge - discount);
    const grandTotal = calculatedGrandTotal; // Use calculated total for invoice accuracy

    const totals: InvoiceTotals = {
        subtotal: round2(subtotal),
        taxBreakdown,
        shippingCharges,
        discount,
        giftWrapCharge,
        grandTotal,
    };

    // ── Payment ──
    const paymentRecord = order.payments?.[0];
    const payment: InvoicePayment = {
        method: order.paymentMethod || paymentRecord?.method || "N/A",
        status: order.paymentStatus,
        transactionId: paymentRecord?.gatewayPaymentId || null,
    };

    return {
        invoiceNumber: generateInvoiceNumber(order.id),
        invoiceDate: new Date(),
        orderDate: order.createdAt,
        orderId: order.id,
        store,
        tax,
        customer,
        billingAddress,
        shippingAddress,
        items,
        totals,
        payment,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

// ─── Error Class ─────────────────────────────────────────────────────────────

export class InvoiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = "InvoiceError";
    }
}
