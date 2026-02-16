import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderDetailsClient from "@/components/admin/OrderDetailsClient";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let order;
    try {
        order = await prisma.order.findUnique({
            where: { id },
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
                                    take: 1
                                }
                            }
                        }
                    }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                },
                timeline: {
                    orderBy: { createdAt: 'desc' }
                },
                shipments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    } catch (error: any) {
        console.error('[OrderDetailsPage] Database error fetching order:', {
            orderId: id,
            error: error.message,
            stack: error.stack
        });

        // For database connection errors, throw to trigger error.tsx
        throw new Error(`Failed to load order details: ${error.message}`);
    }

    // If order not found, show 404
    if (!order) {
        console.log('[OrderDetailsPage] Order not found:', id);
        notFound();
    }

    // Serialize the order data - explicitly construct to avoid passing Prisma Decimal objects
    // Next.js server components CANNOT serialize Prisma Decimal types to client components
    const serializedOrder = {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total.toString(),
        subtotal: order.subtotal?.toString() || "0",
        cgst: order.cgst?.toString() || "0",
        sgst: order.sgst?.toString() || "0",
        igst: order.igst?.toString() || "0",
        shippingCharges: order.shippingCharges?.toString() || "0",
        gstRate: order.gstRate?.toString() || "18",
        discount: order.discount?.toString() || "0",
        giftWrapCharge: order.giftWrapCharge?.toString() || "0",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        cancellationReason: order.cancellationReason,
        refundStatus: order.refundStatus,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        cancelledAt: order.cancelledAt?.toISOString() || null,
        user: order.user,
        items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price.toString(),
            product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price.toString(),
                images: item.product.images.map(img => ({ url: img.url })),
            }
        })),
        notes: order.notes.map(note => ({
            id: note.id,
            content: note.content,
            createdBy: note.createdBy,
            createdAt: note.createdAt.toISOString()
        })),
        timeline: order.timeline.map(event => ({
            id: event.id,
            event: event.event,
            details: event.details,
            createdBy: event.createdBy,
            createdAt: event.createdAt.toISOString()
        })),
        shipments: order.shipments.map(shipment => ({
            id: shipment.id,
            status: shipment.status,
            awbNumber: shipment.awbNumber || undefined,
            courierName: shipment.courierName || undefined,
            labelUrl: shipment.labelUrl || undefined,
            trackingUrl: shipment.trackingUrl || undefined,
            pickupScheduledAt: shipment.pickupScheduledAt?.toISOString() || undefined,
            shippedAt: shipment.shippedAt?.toISOString() || undefined,
            deliveredAt: shipment.deliveredAt?.toISOString() || undefined,
            estimatedDeliveryAt: shipment.estimatedDeliveryAt?.toISOString() || undefined,
        }))
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrderDetailsClient order={serializedOrder} />
        </div>
    );
}

