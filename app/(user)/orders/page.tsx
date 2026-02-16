import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <AccountSidebar />

                    <div className="flex-1 max-w-4xl animate-fade-in-up">
                        <h1 className="text-3xl font-serif text-primary mb-8 tracking-tight">My Orders</h1>

                        <div className="space-y-8">
                            {orders.length === 0 ? (
                                <div className="bg-surface/30 p-16 text-center rounded-sm border border-primary/5 shadow-sm">
                                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                                        <Package className="w-8 h-8 text-primary/40" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-serif text-primary mb-3">No orders yet</h3>
                                    <p className="text-text-muted mb-8 font-light">Looks like you haven't placed any orders yet.</p>
                                    <Link
                                        href="/shop"
                                        className="inline-flex items-center text-primary font-medium hover:text-secondary transition-colors uppercase tracking-[0.2em] text-xs border-b border-primary/30 pb-1 hover:border-secondary"
                                    >
                                        Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-background rounded-sm border border-primary/5 overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-300">
                                        <div className="p-6 border-b border-primary/5 flex flex-wrap gap-6 justify-between items-center bg-surface/30">
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Order Placed</div>
                                                <div className="font-medium text-primary text-sm">{format(new Date(order.createdAt), 'MMMM dd, yyyy')}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Total Amount</div>
                                                <div className="font-medium text-primary text-sm">₹{Number(order.total).toLocaleString('en-IN')}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Order ID</div>
                                                <div className="font-mono text-sm text-primary">#{order.id.slice(-8).toUpperCase()}</div>
                                            </div>
                                            <div>
                                                <Link href={`/orders/${order.id}`}>
                                                    <button className="px-6 py-2 border border-primary/20 hover:border-primary rounded-sm text-[10px] uppercase tracking-[0.2em] font-medium text-primary hover:bg-surface transition-all bg-transparent">
                                                        View Details
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Badge
                                                    variant="outline"
                                                    className={`rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider font-medium border-0
                                                        ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                                                            order.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                                                                'bg-amber-50 text-amber-700'
                                                        }`}
                                                >
                                                    {order.status.toLowerCase()}
                                                </Badge>
                                            </div>

                                            <div className="space-y-6">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="flex gap-6 items-center group">
                                                        <div className="w-16 h-20 bg-secondary/5 rounded-sm overflow-hidden shrink-0 border border-primary/5 relative">
                                                            {item.product.images && item.product.images.length > 0 ? (
                                                                <Image
                                                                    src={item.product.images[0].url}
                                                                    alt={item.product.name}
                                                                    width={64}
                                                                    height={80}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-primary/20">
                                                                    <ShoppingBag size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-serif text-primary text-base mb-1 group-hover:text-secondary transition-colors">{item.product.name}</h4>
                                                            <p className="text-xs text-text-muted uppercase tracking-wide">Qty: {item.quantity}</p>
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
