/**
 * Meta Pixel (fbq) — typed utility helpers
 * Safe to call during SSR (no-ops when window is unavailable).
 */

type FbqEventName =
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "Purchase"
    | "Search"
    | "AddToWishlist"
    | "CompleteRegistration"
    | "Contact"
    | "CustomizeProduct"
    | "Donate"
    | "FindLocation"
    | "Lead"
    | "Schedule"
    | "StartTrial"
    | "SubmitApplication"
    | "Subscribe";

interface FbqParams {
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    content_category?: string;
    value?: number | string;
    currency?: string;
    num_items?: number;
    search_string?: string;
    order_id?: string;
    predicted_ltv?: number | string;
}

function fbq(event: "track", name: FbqEventName, params?: FbqParams): void {
    if (typeof window === "undefined") return;
    const _fbq = (window as any).fbq;
    if (typeof _fbq !== "function") return;
    _fbq("track", name, params);
}

// ─── Specific event helpers ───────────────────────────────────────────────────

export function pixelViewContent(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
}) {
    fbq("track", "ViewContent", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        content_category: product.category,
        value: product.price,
        currency: "INR",
    });
}

export function pixelAddToCart(product: {
    id: string;
    name: string;
    price: number;
    quantity?: number;
}) {
    fbq("track", "AddToCart", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: product.price * (product.quantity ?? 1),
        currency: "INR",
        num_items: product.quantity ?? 1,
    });
}

export function pixelAddToWishlist(product: {
    id: string;
    name: string;
    price?: number;
}) {
    fbq("track", "AddToWishlist", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        currency: "INR",
        value: product.price,
    });
}

export function pixelInitiateCheckout(cart: {
    items: { id: string; price: number; quantity: number }[];
    total: number;
}) {
    fbq("track", "InitiateCheckout", {
        content_ids: cart.items.map((i) => i.id),
        content_type: "product",
        num_items: cart.items.reduce((s, i) => s + i.quantity, 0),
        value: cart.total,
        currency: "INR",
    });
}

export function pixelAddPaymentInfo() {
    fbq("track", "AddPaymentInfo");
}

export function pixelPurchase(order: {
    orderId?: string;
    total: number;
    items: { id: string; price: number; quantity: number }[];
}) {
    fbq("track", "Purchase", {
        order_id: order.orderId,
        content_ids: order.items.map((i) => i.id),
        content_type: "product",
        value: order.total,
        currency: "INR",
        num_items: order.items.reduce((s, i) => s + i.quantity, 0),
    });
}

export function pixelSearch(term: string) {
    fbq("track", "Search", {
        search_string: term,
    });
}

export function pixelCompleteRegistration(params?: { value?: number; currency?: string; content_name?: string }) {
    fbq("track", "CompleteRegistration", params);
}

export function pixelContact(params?: { value?: number; currency?: string }) {
    fbq("track", "Contact", params);
}

export function pixelCustomizeProduct(params?: { content_name?: string; value?: number; currency?: string }) {
    fbq("track", "CustomizeProduct", params);
}

export function pixelDonate(params?: { value?: number; currency?: string }) {
    fbq("track", "Donate", params);
}

export function pixelFindLocation(params?: { content_name?: string; value?: number; currency?: string }) {
    fbq("track", "FindLocation", params);
}

export function pixelLead(params?: { content_category?: string; content_name?: string; value?: number; currency?: string }) {
    fbq("track", "Lead", params);
}

export function pixelSchedule(params?: { content_category?: string; content_name?: string; value?: number; currency?: string }) {
    fbq("track", "Schedule", params);
}

export function pixelStartTrial(params?: { value: number | string; currency: string; predicted_ltv?: number | string }) {
    fbq("track", "StartTrial", params);
}

export function pixelSubmitApplication(params?: { content_category?: string; content_name?: string; value?: number; currency?: string }) {
    fbq("track", "SubmitApplication", params);
}

export function pixelSubscribe(params?: { value: number | string; currency: string; predicted_ltv?: number | string }) {
    fbq("track", "Subscribe", params);
}
