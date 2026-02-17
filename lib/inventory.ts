import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================
// Atomic Inventory Control
// ============================================================
// Provides race-condition-free stock management using
// Prisma's atomic operations and database transactions.
// ============================================================

export interface InventoryItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface InventoryResult {
    success: boolean;
    error?: string;
    failedProduct?: string;
}

/**
 * Atomically validate and decrement stock for multiple products
 * 
 * Uses updateMany with a WHERE guard (stock >= quantity) so the
 * decrement only happens if sufficient stock exists. This is a
 * single atomic database operation — no read-then-write race.
 * 
 * @param tx - Prisma transaction client
 * @param items - Products and quantities to decrement
 * @returns InventoryResult indicating success or specific failure
 */
export async function atomicStockDecrement(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    items: InventoryItem[]
): Promise<InventoryResult> {
    for (const item of items) {
        // First validate product exists and is available
        const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, status: true, stock: true },
        });

        if (!product) {
            return {
                success: false,
                error: `Product not found: ${item.productId}`,
                failedProduct: item.productId,
            };
        }

        if (product.status !== 'PUBLISHED') {
            return {
                success: false,
                error: `Product "${product.name}" is no longer available`,
                failedProduct: item.productId,
            };
        }

        // ATOMIC: Decrement only if stock >= requested quantity
        // Uses updateMany with WHERE clause — single atomic operation
        const result = await tx.product.updateMany({
            where: {
                id: item.productId,
                stock: { gte: item.quantity }, // Guard condition
            },
            data: {
                stock: { decrement: item.quantity }, // Atomic decrement
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                error: `OUT_OF_STOCK_CONFLICT: "${product.name}" - Available: ${product.stock}, Requested: ${item.quantity}`,
                failedProduct: item.productId,
            };
        }
    }

    return { success: true };
}

/**
 * Atomically restore stock for products (used in cancellations, refunds, RTO)
 * 
 * @param tx - Prisma transaction client
 * @param items - Products and quantities to restore
 */
export async function atomicStockRestore(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    items: InventoryItem[]
): Promise<void> {
    for (const item of items) {
        await tx.product.update({
            where: { id: item.productId },
            data: {
                stock: { increment: item.quantity }, // Atomic increment
            },
        });
    }
}

/**
 * Complete transactional order creation with atomic inventory control
 * 
 * Wraps the following in a single database transaction:
 * 1. Atomic stock validation + decrement
 * 2. Order creation
 * 3. Order items creation
 * 4. Payment record (if prepaid)
 * 5. Timeline events
 * 6. Coupon tracking
 * 
 * If ANY step fails, the entire transaction rolls back.
 */
export async function createOrderWithAtomicStock(data: {
    userId: string;
    items: Array<{ id: string; quantity: number; price: number }>;
    total: number;
    subtotal: number;
    discount: number;
    shippingCharges: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstRate: number;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingState: string;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    couponCode?: string | null;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    checkoutSessionId?: string | null;
}): Promise<{ orderId: string } | { error: string; code: string }> {
    try {
        const orderId = await prisma.$transaction(async (tx) => {
            // Step 1: Atomic stock decrement
            const stockResult = await atomicStockDecrement(
                tx,
                data.items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                }))
            );

            if (!stockResult.success) {
                throw new Error(stockResult.error);
            }

            // Step 2: Create order
            const order = await tx.order.create({
                data: {
                    userId: data.userId,
                    total: new Decimal(data.total),
                    subtotal: new Decimal(data.subtotal),
                    discount: new Decimal(data.discount),
                    shippingCharges: new Decimal(data.shippingCharges),
                    cgst: new Decimal(data.cgst),
                    sgst: new Decimal(data.sgst),
                    igst: new Decimal(data.igst),
                    gstRate: new Decimal(data.gstRate),
                    status: data.orderStatus as any,
                    paymentStatus: data.paymentStatus as any,
                    paymentMethod: data.paymentMethod,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    shippingAddress: data.shippingAddress,
                    shippingState: data.shippingState || 'Unknown',
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: new Decimal(item.price),
                        })),
                    },
                },
            });

            // Step 3: Timeline events
            const timelineEvents = [
                {
                    orderId: order.id,
                    event: 'Order Placed',
                    details: `Order placed by ${data.customerName}. Session: ${data.checkoutSessionId || 'none'}`,
                    createdBy: data.userId,
                },
                {
                    orderId: order.id,
                    event: 'Stock Reduced',
                    details: `Stock atomically reduced for ${data.items.length} items`,
                    createdBy: 'system',
                },
            ];

            // Add payment event for prepaid orders
            if (data.razorpayPaymentId) {
                timelineEvents.push({
                    orderId: order.id,
                    event: 'Payment Received',
                    details: `Payment ID: ${data.razorpayPaymentId}`,
                    createdBy: 'system',
                });
            }

            await tx.orderTimeline.createMany({ data: timelineEvents });

            // Step 4: Payment record (if prepaid)
            if (data.razorpayPaymentId && data.razorpayOrderId) {
                await tx.payment.create({
                    data: {
                        orderId: order.id,
                        amount: new Decimal(data.total),
                        currency: 'INR',
                        status: 'COMPLETED',
                        method: 'UPI',
                        gatewayProvider: 'razorpay',
                        gatewayOrderId: data.razorpayOrderId,
                        gatewayPaymentId: data.razorpayPaymentId,
                        gatewaySignature: data.razorpaySignature || '',
                        subtotal: new Decimal(data.subtotal),
                        cgst: new Decimal(data.cgst),
                        sgst: new Decimal(data.sgst),
                        igst: new Decimal(data.igst),
                        gstRate: new Decimal(data.gstRate),
                        verifiedAt: new Date(),
                        metadata: {
                            checkoutSessionId: data.checkoutSessionId || null,
                            source: 'atomic_order_creation',
                        },
                    },
                });
            }

            // Step 5: Coupon tracking
            if (data.couponCode && data.discount > 0) {
                const coupon = await tx.coupon.findUnique({
                    where: { code: data.couponCode },
                });

                if (coupon) {
                    await tx.couponUsage.create({
                        data: {
                            couponId: coupon.id,
                            userId: data.userId,
                            orderId: order.id,
                            discountAmount: new Decimal(data.discount),
                        },
                    });

                    await tx.coupon.update({
                        where: { id: coupon.id },
                        data: {
                            currentUses: { increment: 1 },
                            totalRevenue: { increment: new Decimal(data.total) },
                            totalDiscount: { increment: new Decimal(data.discount) },
                        },
                    });
                }
            }

            return order.id;
        });

        return { orderId };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message.includes('OUT_OF_STOCK_CONFLICT')) {
            return {
                error: message,
                code: 'OUT_OF_STOCK_CONFLICT',
            };
        }

        console.error('[INVENTORY] Order creation failed:', error);
        return {
            error: 'Failed to create order. Please try again.',
            code: 'ORDER_CREATION_FAILED',
        };
    }
}
