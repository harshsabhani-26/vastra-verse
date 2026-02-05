import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus, PaymentStatus, PaymentStatusEnum, PaymentMethodEnum } from "@prisma/client";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: { type: 'MAIN' },
                                    take: 1,
                                    select: { url: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Serialize decimals for GET request
        return NextResponse.json({
            ...order,
            total: order.total.toString(),
            subtotal: order.subtotal?.toString() || "0",
            cgst: order.cgst?.toString() || "0",
            sgst: order.sgst?.toString() || "0",
            igst: order.igst?.toString() || "0",
            shippingCharges: order.shippingCharges?.toString() || "0",
            gstRate: order.gstRate?.toString() || "18",
            discount: order.discount?.toString() || "0",
            giftWrapCharge: order.giftWrapCharge?.toString() || "0",
            items: order.items.map(item => ({
                ...item,
                price: item.price.toString(),
                product: {
                    ...item.product,
                    price: item.product.price.toString(),
                    discount: item.product.discount?.toString() || null,
                    finalPrice: item.product.finalPrice?.toString() || null,
                }
            }))
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { status, paymentStatus, trackingNumber } = body;

        // Validate status transition if status is being updated
        if (status && !Object.values(OrderStatus).includes(status)) {
            return NextResponse.json(
                { error: "Invalid order status" },
                { status: 400 }
            );
        }

        // Get current order data if we are updating tracking, payment, or confirming order
        let order;
        if (trackingNumber || paymentStatus === "PAID" || status === "CONFIRMED") {
            order = await prisma.order.findUnique({
                where: { id: params.id },
                include: { user: true, payments: true }
            });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
                ...(paymentStatus && { paymentStatus }),
                ...(trackingNumber !== undefined && { trackingNumber }),
            },
        });

        // Send Shipping Email if tracking number is added
        if (trackingNumber && order) {
            // Try to find the courier partner to get the template
            const courierName = (order as any).courierName;
            let trackingLink;

            if (courierName) {
                const courier = await prisma.courierPartner.findFirst({
                    where: { name: { equals: courierName, mode: 'insensitive' } }
                });

                if (courier?.trackingUrlTemplate) {
                    trackingLink = courier.trackingUrlTemplate.replace('{TRACKING_NUMBER}', trackingNumber);
                }
            }

            const email = order.user?.email || (order as any).customerEmail; // Fallback
            const name = (order as any).customerName || order.user?.name || "Customer";

            if (email) {
                const { sendOrderShippedEmail } = await import("@/lib/email");
                await sendOrderShippedEmail(
                    email,
                    order.id,
                    name,
                    trackingNumber,
                    courierName || "Courier",
                    trackingLink
                );
            }
        }

        // Handle Order Status Change to CONFIRMED - Create Payment Record if needed
        if (status === "CONFIRMED" && order) {
            // Check if payment record already exists
            const existingPayment = await prisma.payment.findFirst({
                where: { orderId: order.id }
            });

            if (!existingPayment) {
                // Determine payment method from order
                const paymentMethod = order.paymentMethod?.toLowerCase().includes('cod')
                    ? PaymentMethodEnum.COD
                    : PaymentMethodEnum.UPI;

                // For COD orders, payment is PENDING until delivery
                // For online orders confirmed, payment should be COMPLETED
                const paymentStatusValue = paymentMethod === PaymentMethodEnum.COD
                    ? PaymentStatusEnum.PENDING
                    : PaymentStatusEnum.COMPLETED;

                await prisma.payment.create({
                    data: {
                        orderId: order.id,
                        amount: order.total,
                        currency: "INR",
                        status: paymentStatusValue,
                        method: paymentMethod,
                        gatewayProvider: paymentMethod === PaymentMethodEnum.COD ? "cod" : "manual_confirmation",
                        subtotal: order.subtotal,
                        cgst: order.cgst,
                        sgst: order.sgst,
                        igst: order.igst,
                        gstRate: order.gstRate,
                        metadata: {
                            confirmedBy: "admin",
                            confirmedAt: new Date().toISOString()
                        }
                    }
                });
            }
        }

        // Handle Payment Status Change to PAID (Manual Settlement)
        if (paymentStatus === "PAID") {
            // Check if we need to create a payment record
            const codOrder = order;

            if (codOrder) {
                // Check if payment record already exists
                const existingPayment = await prisma.payment.findFirst({
                    where: {
                        orderId: codOrder.id,
                        status: PaymentStatusEnum.COMPLETED
                    }
                });

                if (!existingPayment) {
                    // Check if there's a PENDING payment to update
                    const pendingPayment = await prisma.payment.findFirst({
                        where: {
                            orderId: codOrder.id,
                            status: PaymentStatusEnum.PENDING
                        }
                    });

                    if (pendingPayment) {
                        // Update existing PENDING payment to COMPLETED
                        await prisma.payment.update({
                            where: { id: pendingPayment.id },
                            data: {
                                status: PaymentStatusEnum.COMPLETED,
                                verifiedAt: new Date(),
                                metadata: {
                                    ...(pendingPayment.metadata as any || {}),
                                    settledBy: "admin",
                                    settledAt: new Date().toISOString()
                                }
                            }
                        });
                    } else {
                        // Create new payment record
                        await prisma.payment.create({
                            data: {
                                orderId: codOrder.id,
                                amount: codOrder.total,
                                currency: "INR",
                                status: PaymentStatusEnum.COMPLETED,
                                method: PaymentMethodEnum.COD, // Default to COD for manual settlement
                                gatewayProvider: "manual_settlement",
                                subtotal: codOrder.subtotal,
                                cgst: codOrder.cgst,
                                sgst: codOrder.sgst,
                                igst: codOrder.igst,
                                gstRate: codOrder.gstRate,
                                metadata: {
                                    settledBy: "admin",
                                    settledAt: new Date().toISOString()
                                }
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update order" },
            { status: 500 }
        );
    }
}
