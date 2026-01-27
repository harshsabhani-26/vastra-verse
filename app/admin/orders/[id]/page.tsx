import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderDetailsClient from "@/components/admin/OrderDetailsClient";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await prisma.order.findUnique({
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
            }
        }
    });

    if (!order) {
        notFound();
    }

    // Serialize the order data
    const serializedOrder = {
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
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        cancelledAt: order.cancelledAt?.toISOString() || null,
        items: order.items.map(item => ({
            ...item,
            price: item.price.toString(),
            product: {
                ...item.product,
                price: item.product.price.toString(),
                discount: item.product.discount?.toString() || null,
                finalPrice: item.product.finalPrice?.toString() || null,
            }
        })),
        notes: order.notes.map(note => ({
            ...note,
            createdAt: note.createdAt.toISOString()
        })),
        timeline: order.timeline.map(event => ({
            ...event,
            createdAt: event.createdAt.toISOString()
        }))
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrderDetailsClient order={serializedOrder} />
        </div>
    );
}
