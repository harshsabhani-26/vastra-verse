import prisma from "@/lib/prisma";
import OrdersListClient from "@/components/admin/OrdersListClient";

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
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
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            images: {
                                where: { type: 'MAIN' },
                                take: 1,
                                select: { url: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Convert Decimal to string for client component
    const serializedOrders = orders.map(order => ({
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
        courierName: order.courierName,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        shippingState: order.shippingState,
        trackingNumber: order.trackingNumber,
        items: order.items.map(item => ({
            ...item,
            price: item.price.toString(),
            product: {
                ...item.product,
                price: item.product.price.toString(),
            }
        }))
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-[#1C1917]">Orders</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Manage and track all customer orders
                    </p>
                </div>
            </div>

            <OrdersListClient initialOrders={serializedOrders} />
        </div>
    );
}
