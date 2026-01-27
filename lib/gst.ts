/**
 * GST Calculation Utilities
 * Handles Indian GST calculations for orders
 */

export interface GSTCalculation {
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstRate: number;
    total: number;
    isInterState: boolean;
}

export interface GSTBreakdown {
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstRate: number;
    shippingCharges: number;
    discount: number;
    total: number;
}

// Indian states for GST calculation
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Default business state (change this to your business location)
const BUSINESS_STATE = "Maharashtra";

/**
 * Determine if the transaction is inter-state
 */
export function isInterStateTransaction(customerState: string | null): boolean {
    if (!customerState) return false;
    return customerState.toLowerCase() !== BUSINESS_STATE.toLowerCase();
}

/**
 * Calculate GST for a given amount
 */
export function calculateGST(
    subtotal: number,
    gstRate: number = 18,
    customerState: string | null = null
): GSTCalculation {
    const isInterState = isInterStateTransaction(customerState);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        // Inter-state: IGST
        igst = (subtotal * gstRate) / 100;
    } else {
        // Intra-state: CGST + SGST
        const halfRate = gstRate / 2;
        cgst = (subtotal * halfRate) / 100;
        sgst = (subtotal * halfRate) / 100;
    }

    const total = subtotal + cgst + sgst + igst;

    return {
        subtotal,
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        igst: Number(igst.toFixed(2)),
        gstRate,
        total: Number(total.toFixed(2)),
        isInterState,
    };
}

/**
 * Calculate complete order breakdown with GST, shipping, and discounts
 */
export function calculateOrderBreakdown(
    itemsSubtotal: number,
    options: {
        gstRate?: number;
        customerState?: string | null;
        shippingCharges?: number;
        discount?: number;
    } = {}
): GSTBreakdown {
    const {
        gstRate = 18,
        customerState = null,
        shippingCharges = 0,
        discount = 0,
    } = options;

    const subtotal = itemsSubtotal - discount;
    const gst = calculateGST(subtotal, gstRate, customerState);

    const total = subtotal + gst.cgst + gst.sgst + gst.igst + shippingCharges;

    return {
        subtotal,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        gstRate,
        shippingCharges,
        discount,
        total: Number(total.toFixed(2)),
    };
}

/**
 * Format GST amount with currency
 */
export function formatGSTAmount(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get GST breakdown for display
 */
export function getGSTBreakdownForDisplay(breakdown: GSTBreakdown) {
    return {
        "Subtotal": formatGSTAmount(breakdown.subtotal),
        ...(breakdown.cgst > 0 && { "CGST": formatGSTAmount(breakdown.cgst) }),
        ...(breakdown.sgst > 0 && { "SGST": formatGSTAmount(breakdown.sgst) }),
        ...(breakdown.igst > 0 && { "IGST": formatGSTAmount(breakdown.igst) }),
        ...(breakdown.shippingCharges > 0 && { "Shipping": formatGSTAmount(breakdown.shippingCharges) }),
        ...(breakdown.discount > 0 && { "Discount": `- ${formatGSTAmount(breakdown.discount)}` }),
        "Total": formatGSTAmount(breakdown.total),
    };
}

/**
 * Validate Indian state name
 */
export function isValidIndianState(state: string): boolean {
    return INDIAN_STATES.some(s => s.toLowerCase() === state.toLowerCase());
}

/**
 * Get list of Indian states
 */
export function getIndianStates(): string[] {
    return [...INDIAN_STATES];
}

/**
 * Generate GST invoice number
 * Format: GST-YYYY-MM-XXXXX
 */
export function generateGSTInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 99999)).padStart(5, '0');

    return `GST-${year}-${month}-${random}`;
}

/**
 * Calculate reverse GST (extract GST from total)
 */
export function extractGSTFromTotal(
    totalAmount: number,
    gstRate: number = 18,
    isInterState: boolean = false
): GSTCalculation {
    const subtotal = (totalAmount * 100) / (100 + gstRate);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        igst = totalAmount - subtotal;
    } else {
        const halfGST = (totalAmount - subtotal) / 2;
        cgst = halfGST;
        sgst = halfGST;
    }

    return {
        subtotal: Number(subtotal.toFixed(2)),
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        igst: Number(igst.toFixed(2)),
        gstRate,
        total: totalAmount,
        isInterState,
    };
}
