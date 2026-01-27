import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default async function OrdersPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const orders = await prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
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
            }
        }
    });

    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <AccountSidebar />

                    <div className="flex-1 max-w-4xl">
                        <h1 className="text-3xl font-serif text-[#1C1917] mb-8 tracking-wide">My Orders</h1>

                        <div className="space-y-6">
                            {orders.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-lg border border-stone-200">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-stone-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-[#1C1917] mb-2">No orders yet</h3>
                                    <p className="text-stone-500 mb-6">Looks like you haven't placed any orders yet.</p>
                                    <Link
                                        href="/shop"
                                        className="inline-flex items-center text-[#1a4d3a] font-medium hover:underline"
                                    >
                                        Start Shopping <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-4 md:p-6 border-b border-stone-100 flex flex-wrap gap-4 justify-between items-center bg-stone-50/50">
                                            <div className="space-y-1">
                                                <div className="text-sm text-stone-500">Order Placed</div>
                                                <div className="font-medium text-[#1C1917]">{format(new Date(order.createdAt), 'MMMM dd, yyyy')}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm text-stone-500">Total Amount</div>
                                                <div className="font-medium text-[#1C1917]">₹{Number(order.total).toLocaleString()}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm text-stone-500">Order ID</div>
                                                <div className="font-mono text-sm text-[#1C1917]">#{order.id.slice(-8).toUpperCase()}</div>
                                            </div>
                                            <div>
                                                <Link href={`/orders/${order.id}`}>
                                                    <button className="px-4 py-2 border border-stone-300 rounded text-sm font-medium hover:bg-stone-50 transition-colors">
                                                        View Details
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-2.5 h-2.5 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-500' :
                                                    order.status === 'CANCELLED' ? 'bg-red-500' :
                                                        'bg-amber-500'
                                                    }`} />
                                                <span className="font-medium text-[#1C1917] capitalize">{order.status.toLowerCase()}</span>
                                            </div>

                                            <div className="space-y-4">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="flex gap-4 items-center">
                                                        <div className="w-16 h-16 bg-stone-100 rounded overflow-hidden shrink-0">
                                                            {item.product.images && item.product.images.length > 0 ? (
                                                                <img
                                                                    src={item.product.images[0].url}
                                                                    alt={item.product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                                    <ShoppingBag size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-[#1C1917] line-clamp-1">{item.product.name}</h4>
                                                            <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
