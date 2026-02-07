"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * CRITICAL FIX: Stock Reduction Timing
 * 
 * BEFORE: Stock was reduced immediately upon order creation (WRONG)
 * AFTER: Stock is reserved during order creation, only reduced after payment verification
 * 
 * Order Flow:
 * 1. Create order with status = PENDING
 * 2. Do NOT reduce stock yet
 * 3. Wait for payment verification
 * 4. On payment success -> reduce stock via `/api/payment/verify`
 * 5. On payment failure -> order remains PENDING, stock untouched
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

    // Check for existing pending orders to prevent duplicates
    const existingPendingOrder = await prisma.order.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ["PENDING", "CONFIRMED"] },
            createdAt: {
                gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
            },
        },
    });

    if (existingPendingOrder) {
        if (process.env.NODE_ENV === "development") {
            console.log("Found existing pending order:", existingPendingOrder.id);
        }
        // Return existing order instead of creating duplicate
        return { success: true, orderId: existingPendingOrder.id };
    }

    if (process.env.NODE_ENV === "development") {
        console.log("Creating order with:", {
            userId: session.user.id,
            total,
            subtotal,
            discount,
            shippingCharges,
            customerName,
            recipientPhone,
            phone,
            state,
        });
    }

    // Calculate GST (18% default rate)
    const gstRate = 18;
    const storeState = process.env.STORE_STATE || "Gujarat";
    const isIntraState = state.toLowerCase() === storeState.toLowerCase();

    // GST is already included in the subtotal, so we need to extract it
    // Formula: GST Amount = (Subtotal * GST Rate) / (100 + GST Rate)
    const gstAmount = (subtotal * gstRate) / (100 + gstRate);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
        // For intrastate: CGST + SGST (both 9% each for 18% total)
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
    } else {
        // For interstate: IGST (18%)
        igst = gstAmount;
    }

    if (process.env.NODE_ENV === "development") {
        console.log("GST Calculation:", {
            subtotal,
            gstRate,
            isIntraState,
            cgst,
            sgst,
            igst,
            totalGst: cgst + sgst + igst,
        });
    }

    // CRITICAL: Stock Reduction Timing
    // - COD orders: Stock reduced immediately during order creation (to prevent overselling)
    // - Prepaid orders: Stock will be reduced only after payment verification
    const orderId = await prisma.$transaction(async (tx) => {
        // Validate stock availability BEFORE creating order
        for (const item of items) {
            const product = await tx.product.findUnique({
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
                status: "PENDING",
                paymentStatus: "PENDING",
                paymentMethod: paymentMethod || "prepaid",
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
                details: `Order placed by ${customerName}. Payment pending.`,
                createdBy: session.user.id,
            },
        });

        // CRITICAL: For COD orders, reduce stock immediately
        // Prepaid orders will reduce stock after payment verification
        if (paymentMethod === "COD") {
            // Reduce stock for each item
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Update order status to CONFIRMED for COD
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: "CONFIRMED",
                    paymentStatus: "PENDING", // Still pending until delivery
                }
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
        }

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

    return { success: true, orderId };
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
