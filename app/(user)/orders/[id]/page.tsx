import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, CreditCard, Package, Truck, Phone, Mail, Calendar, Clock, Receipt } from "lucide-react";
import { format } from "date-fns";
import { TrackingTimeline } from "@/components/order/TrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { canRequestReturn } from "@/lib/return-eligibility";
import ReturnAction from "@/components/account/ReturnAction";

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const order = await prisma.order.findUnique({
        where: {
            id: params.id,
            userId: session.user.id
        },
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
            },
            timeline: true,
            returnRequests: true // Fetch return requests for eligibility check
        }
    });

    if (!order) {
        notFound();
    }

    const steps = [
        { status: 'PENDING', label: 'Order Placed', icon: Receipt },
        { status: 'CONFIRMED', label: 'Confirmed', icon: Package },
        { status: 'SHIPPED', label: 'Shipped', icon: Truck },
        { status: 'DELIVERED', label: 'Delivered', icon: MapPin },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status) !== -1
        ? steps.findIndex(s => s.status === order.status)
        : order.status === 'CANCELLED' ? -1 : 0;

    return (
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4 md:px-8 max-w-5xl">
                {/* Back Link */}
                <Link href="/orders" className="inline-flex items-center text-text-muted hover:text-primary transition-colors mb-8 group text-[10px] uppercase tracking-[0.2em]">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Orders
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-primary/10">
                    <div>
                        <h1 className="text-3xl font-serif text-primary mb-2 tracking-tight">Order Details</h1>
                        <p className="text-text-muted text-sm tracking-wide">
                            Order ID: <span className="font-mono text-primary">#{order.id.slice(-8).toUpperCase()}</span>
                        </p>
                    </div>
                    {order.status === 'CANCELLED' ? (
                        <Badge variant="destructive" className="px-4 py-2 uppercase tracking-widest text-[10px]">
                            Cancelled
                        </Badge>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-text-muted text-sm">Placed on:</span>
                            <span className="font-medium text-primary text-sm">{format(new Date(order.createdAt), 'MMMM dd, yyyy')}</span>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Order Progress (Only for non-cancelled) */}
                        {order.status !== 'CANCELLED' && (
                            <div className="bg-background p-8 rounded-sm border border-primary/5 shadow-luxury">
                                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-10 border-b border-primary/5 pb-2 inline-block">Order Status</h2>
                                <div className="relative">
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/10 -translate-y-1/2 hidden md:block"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                                        {steps.map((step, index) => {
                                            const Icon = step.icon;
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;

                                            // Handling cancelled state or other custom logic if needed
                                            return (
                                                <div key={step.status} className="flex md:flex-col items-center gap-4 md:gap-2">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 bg-background ${isCompleted ? 'border-primary text-primary shadow-md' : 'border-primary/10 text-primary/20'
                                                        }`}>
                                                        <Icon size={16} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="md:text-center bg-background px-2">
                                                        <p className={`text-[10px] uppercase tracking-wider font-medium ${isCompleted ? 'text-primary' : 'text-text-muted/60'}`}>{step.label}</p>
                                                        {isCurrent && (
                                                            <p className="text-[10px] text-secondary font-bold mt-1 animate-pulse uppercase tracking-wider">In Progress</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        <div className="bg-background rounded-sm border border-primary/5 shadow-luxury overflow-hidden">
                            <div className="p-6 border-b border-primary/5 bg-surface/30">
                                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Items Ordered</h2>
                            </div>
                            <div className="divide-y divide-primary/5">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-6 flex gap-6 items-start group">
                                        <div className="w-20 h-28 bg-secondary/5 rounded-sm overflow-hidden shrink-0 border border-primary/5 relative">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <Image
                                                    src={item.product.images[0].url}
                                                    alt={item.product.name}
                                                    width={80}
                                                    height={112}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/20">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-serif text-primary text-lg tracking-tight group-hover:text-secondary transition-colors">{item.product.name}</h3>
                                                <p className="font-medium text-primary">₹{Number(item.price).toLocaleString('en-IN')}</p>
                                            </div>
                                            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4">Quantity: {item.quantity}</p>

                                            {/* Action Buttons (Rating/Return could go here in future) */}
                                            {order.status === 'DELIVERED' && (
                                                <button className="text-[10px] text-secondary font-bold hover:underline uppercase tracking-[0.2em]">
                                                    Write a Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">

                        {/* Summary */}
                        <div className="bg-background p-6 rounded-sm border border-primary/5 shadow-luxury">
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6 border-b border-primary/5 pb-2">Order Summary</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-text-muted">
                                    <span>Subtotal</span>
                                    <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-text-muted">
                                    <span>Shipping</span>
                                    <span>{Number(order.shippingCharges) > 0 ? `₹${Number(order.shippingCharges).toLocaleString('en-IN')}` : "Free"}</span>
                                </div>
                                <div className="flex justify-between text-text-muted">
                                    <span>Tax (GST)</span>
                                    <span>₹{(Number(order.cgst) + Number(order.sgst) + Number(order.igst)).toLocaleString('en-IN')}</span>
                                </div>
                                {Number(order.discount) > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span>Discount</span>
                                        <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-primary/10 flex justify-between font-serif font-medium text-primary text-lg mt-2 tracking-tight">
                                    <span>Total</span>
                                    <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Details */}
                        <div className="bg-background p-6 rounded-sm border border-primary/5 shadow-luxury">
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6 flex items-center gap-2 border-b border-primary/5 pb-2">
                                <Truck className="w-4 h-4 text-primary/60" />
                                Shipping Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">Delivery Address</p>
                                    <div className="text-primary text-sm leading-relaxed p-4 bg-surface/30 rounded-sm border border-primary/5">
                                        {(order as any).shippingAddress ? (
                                            <div className="whitespace-pre-line">
                                                {(order as any).shippingAddress['fullName'] && <p className="font-bold text-primary mb-1 font-serif tracking-wide">{(order as any).shippingAddress['fullName']}</p>}
                                                {(order as any).shippingAddress['addressLine1']}
                                                <br />
                                                {(order as any).shippingAddress['city']}, {(order as any).shippingAddress['state']} {(order as any).shippingAddress['pincode']}
                                                <br />
                                                {(order as any).shippingAddress['country'] || 'India'}
                                                <br />
                                                <p className="mt-2 text-text-muted text-xs">Phone: <span className="text-primary">{(order as any).shippingAddress['mobile']}</span></p>
                                            </div>
                                        ) : (
                                            <span className="italic text-text-muted">Address not available</span>
                                        )}
                                    </div>
                                </div>

                                {order.trackingNumber && (
                                    <div className="pt-4 border-t border-primary/5">
                                        <p className="font-medium text-primary mb-1 text-[10px] uppercase tracking-wide">Tracking Information</p>
                                        <p className="text-sm text-text-muted mb-2">
                                            Courier: {(order as any).courierName || 'Standard Shipping'}
                                        </p>
                                        <p className="text-sm text-primary font-mono bg-surface/50 px-2 py-1 inline-block rounded-sm border border-primary/10">
                                            {order.trackingNumber}
                                        </p>
                                        <Link href="/track-order" className="block mt-4">
                                            <button className="w-full text-[10px] bg-surface hover:bg-primary hover:text-white border border-primary/20 text-primary px-4 py-3 rounded-sm transition-all uppercase tracking-[0.2em] font-bold">
                                                Track Shipment
                                            </button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-background p-6 rounded-sm border border-primary/5 shadow-luxury">
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6 flex items-center gap-2 border-b border-primary/5 pb-2">
                                <CreditCard className="w-4 h-4 text-primary/60" />
                                Payment Details
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Method</span>
                                    <span className="font-medium text-primary uppercase text-[10px] tracking-wide border border-primary/10 px-2 py-1 rounded-sm bg-surface/50">{order.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Status</span>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium border-0
                                            ${order.status === 'DELIVERED' || order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' :
                                                order.status === 'CANCELLED' || order.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700' :
                                                    'bg-amber-50 text-amber-700'
                                            }`}
                                    >
                                        {order.paymentStatus}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Return Action */}
                        {canRequestReturn(order as any).isEligible && (
                            <div className="bg-background p-6 rounded-sm border border-primary/5 shadow-luxury">
                                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6 flex items-center gap-2 border-b border-primary/5 pb-2">
                                    <Clock className="w-4 h-4 text-primary/60" />
                                    Return Order
                                </h2>
                                <p className="text-xs text-text-muted mb-4">
                                    Eligible for return within 7 days of delivery.
                                </p>
                                <ReturnAction orderId={order.id} />
                            </div>
                        )}

                        {/* Active Return Status */}
                        {order.returnRequests && order.returnRequests.length > 0 && (
                            <div className="bg-background p-6 rounded-sm border border-primary/5 shadow-luxury">
                                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6 flex items-center gap-2 border-b border-primary/5 pb-2">
                                    Return Status
                                </h2>
                                <div className="space-y-3">
                                    {order.returnRequests.map(req => (
                                        <div key={req.id} className="p-3 bg-surface/50 rounded-sm border border-primary/10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{req.status.replace(/_/g, " ")}</span>
                                                <span className="text-[10px] text-text-muted">{format(new Date(req.requestedAt), 'MMM dd')}</span>
                                            </div>
                                            <p className="text-xs text-text-muted truncate">{req.description || req.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Help Section */}
                        <div className="bg-surface/30 p-8 rounded-sm border border-primary/5 text-center shadow-sm">
                            <h3 className="font-serif text-primary text-gl mb-2">Need Help?</h3>
                            <p className="text-xs text-text-muted mb-6 font-light">
                                Have issues with this order? Contact our support team.
                            </p>
                            <Link href="/contact">
                                <button className="w-full py-3 border border-primary/20 text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-all rounded-sm uppercase tracking-[0.2em]">
                                    Contact Support
                                </button>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
