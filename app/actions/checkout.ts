"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { clearCart } from "./cart";

/**
 * CRITICAL FIX: Payment-First Order Creation
 * 
 * NEW BEHAVIOR:
 * - PREPAID: Do NOT create Order. Only validate cart and return order data.
 *   Order will be created in /api/payment/verify AFTER successful payment.
 * - COD: Create Order immediately with stock reduction (existing behavior).
 * 
 * This ensures failed/cancelled prepaid payments never create orphaned orders.
 */

export async function createOrder(formData: FormData) {
    const session = await auth();

    // Require authentication for checkout
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/cart");
    }

    // Extract form data
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const address1 = formData.get("address1") as string;
    const address2 = (formData.get("address2") as string) || "";
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zip = formData.get("zip") as string;
    const country = (formData.get("country") as string) || "India";
    const recipientPhone = formData.get("recipientPhone") as string;
    const paymentMethod = formData.get("payment") as string;

    // Extract cart data
    const cartItemsJson = formData.get("cartItems") as string;
    const subtotal = Number(formData.get("subtotal")) || 0;
    const shippingCharges = Number(formData.get("shippingCharges")) || 0;
    const discount = Number(formData.get("discount")) || 0;
    const total = Number(formData.get("total")) || 0;

    // Extract coupon data if applied
    const couponCode = (formData.get("couponCode") as string) || null;
    const couponId = (formData.get("couponId") as string) || null;

    // Extract idempotency key
    const checkoutSessionId = (formData.get("checkoutSessionId") as string) || null;

    let items: any[] = [];
    try {
        items = cartItemsJson ? JSON.parse(cartItemsJson) : [];
    } catch (e) {
        console.error("Failed to parse cart items", e);
        throw new Error("Invalid cart data");
    }

    // Validate cart items
    if (items.length === 0) {
        throw new Error("Cart is empty");
    }

    // Create shipping address string
    const fullAddress = `${address1}${address2 ? ", " + address2 : ""}, ${city}, ${state}, ${country} - ${zip}`;
    const customerName = `${firstName} ${lastName}`;

    // Verify user exists in database (handle stale sessions)
    const userExists = await prisma.user.findUnique({
        where: { id: session.user.id! },
    });

    if (!userExists) {
        console.error("User not found in database:", session.user.id);
        redirect("/login?callbackUrl=/cart&error=session_expired");
    }

    // Calculate GST (18% default rate)
    const gstRate = 18;
    const storeState = process.env.STORE_STATE || "Gujarat";
    const isIntraState = state.toLowerCase() === storeState.toLowerCase();

    // GST is already included in the subtotal, so we need to extract it
    const gstAmount = (subtotal * gstRate) / (100 + gstRate);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
    } else {
        igst = gstAmount;
    }

    // CRITICAL: Different flows for PREPAID vs COD
    if (paymentMethod === "prepaid") {
        // PREPAID: Do NOT create Order record yet
        // Just validate stock and return order data for Razorpay

        // Validate stock availability
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
                select: { stock: true, name: true, status: true },
            });

            if (!product) {
                throw new Error(`Product ${item.id} not found`);
            }

            if (product.status !== "PUBLISHED") {
                throw new Error(`Product "${product.name}" is no longer available`);
            }

            if (product.stock < item.quantity) {
                throw new Error(
                    `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
                );
            }
        }

        if (process.env.NODE_ENV === "development") {
            console.log("[PREPAID] Stock validated, returning order data WITHOUT creating Order record");
        }

        // Return order data for Razorpay payment
        // Order will be created in /api/payment/verify after successful payment
        return {
            success: true,
            isPrepaid: true,
            checkoutSessionId,
            orderData: {
                userId: session.user.id,
                items,
                total,
                subtotal,
                discount,
                shippingCharges,
                cgst,
                sgst,
                igst,
                gstRate,
                customerName,
                customerPhone: recipientPhone || phone || "",
                shippingAddress: fullAddress,
                shippingState: state,
                couponCode,
                couponId,
            }
        };
    }

    // COD: Create Order immediately (existing behavior)

    // IDEMPOTENCY: Check if a COD order was already created for this checkout session
    if (checkoutSessionId) {
        const existingTimeline = await prisma.orderTimeline.findFirst({
            where: {
                details: { contains: checkoutSessionId },
                event: "Order Placed",
                order: { userId: session.user.id! },
            },
            select: { orderId: true },
        });
        if (existingTimeline) {
            console.log("[IDEMPOTENCY] Duplicate COD order blocked", { checkoutSessionId, existingOrderId: existingTimeline.orderId });
            return { success: true, orderId: existingTimeline.orderId, isCOD: true };
        }
    }

    if (process.env.NODE_ENV === "development") {
        console.log("Creating COD order with:", {
            userId: session.user.id,
            total,
            subtotal,
            discount,
            shippingCharges,
            customerName,
            recipientPhone,
            phone,
            state,
            checkoutSessionId,
        });
    }

    const orderId = await prisma.$transaction(async (tx) => {
        // ATOMIC stock validation + decrement: prevents race conditions
        // Uses updateMany with stock >= quantity guard — if count === 0, stock was insufficient
        for (const item of items) {
            // First check product exists and is published
            const product = await tx.product.findUnique({
                where: { id: item.id },
                select: { name: true, status: true },
            });

            if (!product) {
                throw new Error(`Product ${item.id} not found`);
            }

            if (product.status !== "PUBLISHED") {
                throw new Error(`Product "${product.name}" is no longer available`);
            }

            // Atomic: decrement only if stock >= requested quantity
            const result = await tx.product.updateMany({
                where: {
                    id: item.id,
                    stock: { gte: item.quantity },
                },
                data: {
                    stock: { decrement: item.quantity },
                },
            });

            if (result.count === 0) {
                throw new Error(
                    `Insufficient stock for "${product.name}". Requested: ${item.quantity}`
                );
            }
        }

        // Create the order
        const order = await tx.order.create({
            data: {
                userId: session.user.id!,
                total: new Decimal(total),
                subtotal: new Decimal(subtotal),
                discount: new Decimal(discount),
                shippingCharges: new Decimal(shippingCharges),
                cgst: new Decimal(cgst),
                sgst: new Decimal(sgst),
                igst: new Decimal(igst),
                gstRate: new Decimal(gstRate),
                status: "CONFIRMED", // COD orders are confirmed immediately
                paymentStatus: "PENDING", // Will be paid on delivery
                paymentMethod: "COD",
                customerName: customerName,
                customerPhone: recipientPhone || phone || "",
                shippingAddress: fullAddress,
                shippingState: state || "Unknown",
                items: {
                    create: items.map((item: any) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: new Decimal(item.price),
                    })),
                },
            },
        });

        // Create order timeline event
        await tx.orderTimeline.create({
            data: {
                orderId: order.id,
                event: "Order Placed",
                details: `COD order placed by ${customerName}. Payment on delivery. Session: ${checkoutSessionId || "none"}`,
                createdBy: session.user.id,
            },
        });

        // Add timeline event for stock reduction
        await tx.orderTimeline.create({
            data: {
                orderId: order.id,
                event: "Stock Reduced",
                details: `Stock reduced for ${items.length} items (COD order)`,
                createdBy: "system"
            }
        });

        // Track coupon usage if a coupon was applied
        if (couponCode && discount > 0) {
            const coupon = await tx.coupon.findUnique({
                where: { code: couponCode },
            });

            if (coupon) {
                // Create coupon usage record
                await tx.couponUsage.create({
                    data: {
                        couponId: coupon.id,
                        userId: session.user.id!,
                        orderId: order.id,
                        discountAmount: new Decimal(discount),
                    },
                });

                // Update coupon statistics
                await tx.coupon.update({
                    where: { id: coupon.id },
                    data: {
                        currentUses: {
                            increment: 1,
                        },
                        totalRevenue: {
                            increment: new Decimal(total),
                        },
                        totalDiscount: {
                            increment: new Decimal(discount),
                        },
                    },
                });
            }
        }

        return order.id;
    });

    // CRITICAL: Clear cart after successful COD order
    try {
        await clearCart();
        console.log("[CART_CLEARED] Server-side", { orderId, paymentMethod: "COD" });
    } catch (error) {
        console.error("Failed to clear cart after COD order:", error);
    }

    return { success: true, orderId, isCOD: true };
}

/**
 * NEW FUNCTION: Create Order After Payment Verification
 * 
 * Called ONLY from /api/payment/verify after successful Razorpay signature verification.
 * This ensures orders are created only for successful payments.
 */
export async function createOrderAfterPayment(data: {
    userId: string;
    items: any[];
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
    couponCode?: string | null;
    couponId?: string | null;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    checkoutSessionId?: string | null;
}) {
    const orderId = await prisma.$transaction(async (tx) => {
        // ATOMIC stock validation + decrement: prevents race conditions
        for (const item of data.items) {
            // First check product exists and is published
            const product = await tx.product.findUnique({
                where: { id: item.id },
                select: { name: true, status: true },
            });

            if (!product) {
                throw new Error(`Product ${item.id} not found during payment verification`);
            }

            if (product.status !== "PUBLISHED") {
                throw new Error(`Product "${product.name}" is no longer available`);
            }

            // Atomic: decrement only if stock >= requested quantity
            const result = await tx.product.updateMany({
                where: {
                    id: item.id,
                    stock: { gte: item.quantity },
                },
                data: {
                    stock: { decrement: item.quantity },
                },
            });

            if (result.count === 0) {
                throw new Error(
                    `Insufficient stock for "${product.name}". Requested: ${item.quantity}`
                );
            }
        }

        // Create the order with PAID status
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
                status: "CONFIRMED", // Order is confirmed
                paymentStatus: "PAID", // Payment already verified
                paymentMethod: "Prepaid (Razorpay)",
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                shippingAddress: data.shippingAddress,
                shippingState: data.shippingState,
                items: {
                    create: data.items.map((item: any) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: new Decimal(item.price),
                    })),
                },
            },
        });

        // Create Payment Record
        await tx.payment.create({
            data: {
                orderId: order.id,
                amount: new Decimal(data.total),
                currency: "INR",
                status: "COMPLETED",
                method: "UPI", // Default - could be determined from Razorpay response
                gatewayProvider: "razorpay",
                gatewayOrderId: data.razorpayOrderId,
                gatewayPaymentId: data.razorpayPaymentId,
                gatewaySignature: data.razorpaySignature,
                subtotal: new Decimal(data.subtotal),
                cgst: new Decimal(data.cgst),
                sgst: new Decimal(data.sgst),
                igst: new Decimal(data.igst),
                gstRate: new Decimal(data.gstRate),
                verifiedAt: new Date(),
                metadata: {
                    checkoutSessionId: data.checkoutSessionId || null,
                    source: data.razorpaySignature === "webhook_verified" ? "webhook" : "client_verify",
                },
            }
        });

        // Create Timeline Events
        await tx.orderTimeline.createMany({
            data: [
                {
                    orderId: order.id,
                    event: "Order Placed",
                    details: `Prepaid order placed by ${data.customerName}`,
                    createdBy: data.userId
                },
                {
                    orderId: order.id,
                    event: "Payment Received",
                    details: `Payment ID: ${data.razorpayPaymentId}, Order ID: ${data.razorpayOrderId}`,
                    createdBy: "system"
                },
                {
                    orderId: order.id,
                    event: "Stock Reduced",
                    details: `Stock reduced for ${data.items.length} items`,
                    createdBy: "system"
                }
            ]
        });

        // Track coupon usage if a coupon was applied
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

    return orderId;
}


export async function checkUserPhoneVerification(phone: string) {
    const session = await auth();
    if (!session?.user?.id) return { isVerified: false };

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (user && user.phone === phone && user.phoneVerified) {
        return { isVerified: true };
    }

    return { isVerified: false };
}
