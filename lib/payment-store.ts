/**
 * In-memory store for payment data pending webhook/verification.
 * Key: razorpayOrderId
 * Value: { orderData, checkoutSessionId, createdAt }
 * 
 * Auto-cleaned: entries older than 30 minutes are pruned on each write.
 */

// Use a global variable to persist across hot reloads in dev
const globalForPaymentStore = global as unknown as {
    pendingOrderData: Map<string, {
        orderData: any;
        checkoutSessionId: string;
        createdAt: number;
    }>
};

const pendingOrderData = globalForPaymentStore.pendingOrderData || new Map();

if (process.env.NODE_ENV !== 'production') {
    globalForPaymentStore.pendingOrderData = pendingOrderData;
}

function cleanupPendingOrders() {
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    for (const [key, value] of pendingOrderData) {
        if (value.createdAt < thirtyMinAgo) {
            pendingOrderData.delete(key);
        }
    }
}

export function storePendingOrderData(razorpayOrderId: string, data: { orderData: any; checkoutSessionId: string }) {
    cleanupPendingOrders();
    pendingOrderData.set(razorpayOrderId, {
        ...data,
        createdAt: Date.now(),
    });
}

export function getPendingOrderData(razorpayOrderId: string) {
    return pendingOrderData.get(razorpayOrderId) || null;
}

export function removePendingOrderData(razorpayOrderId: string) {
    pendingOrderData.delete(razorpayOrderId);
}
