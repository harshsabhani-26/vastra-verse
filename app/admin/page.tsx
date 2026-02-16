import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { DashboardStats } from "@/lib/services/dashboard-stats";
import Link from "next/link";
import Image from "next/image";
import {
    ShoppingBag,
    Package,
    Truck,
    RotateCcw,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Clock,
    ArrowRight,
    DollarSign,
    Ban,
    CheckCircle2,
    XCircle,
    Eye,
    Zap,
    BarChart3,
} from "lucide-react";
import DashboardClient from "@/components/admin/DashboardClient";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const session = await auth();

    // Parallel data fetch
    const [kpis, actionRequired, systemAlerts, recentOrders, bestSellers] = await Promise.all([
        DashboardStats.getKPIs(),
        DashboardStats.getActionRequired(),
        DashboardStats.getSystemAlerts(),
        // Recent 8 orders
        prisma.order.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                user: { select: { name: true, email: true } },
            },
        }),
        // Best sellers
        prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        }),
    ]);

    // Get best seller product details
    const bestSellerProducts = bestSellers.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: bestSellers.map((bs: { productId: string }) => bs.productId) } },
            select: {
                id: true, name: true, price: true, stock: true,
                images: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
            },
        })
        : [];

    // Calculate trends
    const ordersTrend = kpis.yesterdayOrders > 0
        ? ((kpis.todayOrders - kpis.yesterdayOrders) / kpis.yesterdayOrders * 100)
        : kpis.todayOrders > 0 ? 100 : 0;

    const revenueTrend = kpis.yesterdayRevenue > 0
        ? ((kpis.todayRevenue - kpis.yesterdayRevenue) / kpis.yesterdayRevenue * 100)
        : kpis.todayRevenue > 0 ? 100 : 0;

    // Total urgent actions
    const totalActions = (Object.values(actionRequired) as number[]).reduce((a: number, b: number) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* ─── System Alert Banner ────────────────────────────────────── */}
            {systemAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle size={18} className="shrink-0" />
                        <span className="font-semibold text-sm">System Alerts</span>
                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{systemAlerts.length}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        {systemAlerts.slice(0, 3).map((alert: { id: string; severity: string; message: string }) => (
                            <p key={alert.id} className="text-sm text-red-600 flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 'bg-red-400'}`} />
                                {alert.message}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                        Command Center
                    </h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        Welcome back, {session?.user?.name || 'Admin'} — here&apos;s your operations overview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalActions > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <Zap size={14} className="text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">
                                {totalActions} action{totalActions !== 1 ? 's' : ''} needed
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Today's Orders"
                    value={kpis.todayOrders}
                    icon={<ShoppingBag size={18} />}
                    trend={ordersTrend}
                    color="blue"
                />
                <KPICard
                    label="Today's Revenue"
                    value={`₹${kpis.todayRevenue.toLocaleString()}`}
                    icon={<DollarSign size={18} />}
                    trend={revenueTrend}
                    color="emerald"
                />
                <KPICard
                    label="Pending Orders"
                    value={kpis.pendingOrders}
                    icon={<Clock size={18} />}
                    color="amber"
                    urgent={kpis.pendingOrders > 5}
                />
                <KPICard
                    label="Orders to Ship"
                    value={kpis.ordersToShip}
                    icon={<Package size={18} />}
                    color="violet"
                />
                <KPICard
                    label="Returns Pending"
                    value={kpis.returnsPending}
                    icon={<RotateCcw size={18} />}
                    color="orange"
                    urgent={kpis.returnsPending > 0}
                />
                <KPICard
                    label="Refunds Pending"
                    value={kpis.refundsPending}
                    icon={<CreditCard size={18} />}
                    color="rose"
                    urgent={kpis.refundsPending > 0}
                />
                <KPICard
                    label="In Transit"
                    value={kpis.shipmentsInTransit}
                    icon={<Truck size={18} />}
                    color="sky"
                />
                <KPICard
                    label="Failed Deliveries"
                    value={kpis.failedDeliveries}
                    icon={<Ban size={18} />}
                    color="red"
                    urgent={kpis.failedDeliveries > 0}
                />
            </div>

            {/* ─── Revenue Overview ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-5 text-white lg:col-span-1">
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Monthly Revenue</p>
                    <p className="text-3xl font-bold mt-2">₹{kpis.monthlyRevenue.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <div>
                            <p className="text-white/40 text-xs">Low Stock</p>
                            <p className="font-semibold text-amber-400">{kpis.lowStockProducts} items</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-white/40 text-xs">Failed Deliveries</p>
                            <p className="font-semibold text-red-400">{kpis.failedDeliveries}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-white/40 text-xs">In Transit</p>
                            <p className="font-semibold text-sky-400">{kpis.shipmentsInTransit}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-stone-200 p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-stone-800 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <QuickAction href="/admin/orders" icon={<Package size={16} />} label="View Orders" color="blue" />
                        <QuickAction href="/admin/products/add" icon={<ShoppingBag size={16} />} label="Add Product" color="emerald" />
                        <QuickAction href="/admin/returns" icon={<RotateCcw size={16} />} label="Review Returns" color="orange" />
                        <QuickAction href="/admin/reports" icon={<BarChart3 size={16} />} label="View Reports" color="violet" />
                    </div>
                </div>
            </div>

            {/* ─── Action Required + Activity Feed ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action Required Panel */}
                <div className="bg-white rounded-xl border border-stone-200 p-5 lg:col-span-1 order-2 lg:order-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" />
                            Action Required
                        </h3>
                        {totalActions > 0 && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {totalActions}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <ActionCard
                            label="Orders Awaiting Confirmation"
                            count={actionRequired.ordersAwaitingConfirmation}
                            href="/admin/orders"
                            color="amber"
                            icon={<Clock size={14} />}
                        />
                        <ActionCard
                            label="Returns Awaiting Approval"
                            count={actionRequired.returnsAwaitingApproval}
                            href="/admin/returns"
                            color="orange"
                            icon={<RotateCcw size={14} />}
                        />
                        <ActionCard
                            label="Refunds Pending Approval"
                            count={actionRequired.refundsAwaitingApproval}
                            href="/admin/payments"
                            color="rose"
                            icon={<CreditCard size={14} />}
                        />
                        <ActionCard
                            label="Shipments Ready to Ship"
                            count={actionRequired.shipmentsReadyToShip}
                            href="/admin/shipping-hub"
                            color="blue"
                            icon={<Package size={14} />}
                        />
                        <ActionCard
                            label="Failed Shipments"
                            count={actionRequired.failedShipments}
                            href="/admin/shipping-hub"
                            color="red"
                            icon={<XCircle size={14} />}
                        />
                        <ActionCard
                            label="Critical Low Stock"
                            count={actionRequired.lowStockItems}
                            href="/admin/inventory"
                            color="purple"
                            icon={<AlertTriangle size={14} />}
                        />
                    </div>
                </div>

                {/* Client-Side Activity Feed + Polling */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                    <DashboardClient />
                </div>
            </div>

            {/* ─── Recent Orders + Best Sellers ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-stone-800">Recent Orders</h3>
                        <Link href="/admin/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-stone-400 py-8 text-center">No orders yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentOrders.map((order: any) => (
                                <Link
                                    key={order.id}
                                    href={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <StatusDot status={order.status} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-stone-800 truncate group-hover:text-blue-600 transition-colors">
                                                {order.user?.name || order.user?.email || 'Guest'}
                                            </p>
                                            <p className="text-[11px] text-stone-400">
                                                #{order.id.slice(0, 8)} · {formatTimeAgo(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-sm font-semibold text-stone-800">₹{Number(order.total).toLocaleString()}</p>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Best Sellers */}
                <div className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-stone-800">Best Sellers</h3>
                        <Link href="/admin/products" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            All Products <ArrowRight size={12} />
                        </Link>
                    </div>
                    {bestSellerProducts.length === 0 ? (
                        <p className="text-sm text-stone-400 py-8 text-center">No sales data yet</p>
                    ) : (
                        <div className="space-y-2">
                            {bestSellers.map((seller: any, i: number) => {
                                const product = bestSellerProducts.find(p => p.id === seller.productId);
                                if (!product) return null;
                                return (
                                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                                        <span className="text-xs font-bold text-stone-300 w-5 text-center">#{i + 1}</span>
                                        <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden relative shrink-0">
                                            {product.images[0] && (
                                                <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-800 truncate">{product.name}</p>
                                            <p className="text-[11px] text-stone-400">₹{Number(product.price).toLocaleString()} · Stock: {product.stock}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-emerald-600">{seller._sum.quantity}</p>
                                            <p className="text-[10px] text-stone-400">sold</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500', border: 'border-violet-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500', border: 'border-orange-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-500', border: 'border-sky-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100' },
};

function KPICard({ label, value, icon, trend, color, urgent }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: number;
    color: string;
    urgent?: boolean;
}) {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`bg-white rounded-xl border ${urgent ? 'border-red-200 ring-1 ring-red-100' : 'border-stone-200'} p-4 hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center ${c.icon}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <p className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-stone-900'}`}>
                    {value}
                </p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend).toFixed(0)}%
                    </div>
                )}
                {urgent && typeof value === 'number' && value > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
            </div>
        </div>
    );
}

function ActionCard({ label, count, href, color, icon }: {
    label: string;
    count: number;
    href: string;
    color: string;
    icon: React.ReactNode;
}) {
    const c = colorMap[color] || colorMap.blue;
    if (count === 0) {
        return (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-stone-50/50">
                <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center ${c.icon}`}>{icon}</div>
                <span className="text-xs text-stone-400 flex-1">{label}</span>
                <CheckCircle2 size={14} className="text-stone-300" />
            </div>
        );
    }
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${c.bg} border ${c.border} hover:shadow-sm transition-all group`}
        >
            <div className={`w-7 h-7 rounded-md bg-white/80 flex items-center justify-center ${c.icon}`}>{icon}</div>
            <span className={`text-xs font-medium ${c.text} flex-1`}>{label}</span>
            <span className={`text-sm font-bold ${c.text}`}>{count}</span>
            <ArrowRight size={12} className={`${c.icon} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </Link>
    );
}

function QuickAction({ href, icon, label, color }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    color: string;
}) {
    const c = colorMap[color] || colorMap.blue;
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 p-3 rounded-lg border border-stone-100 hover:${c.bg} hover:border-${color}-200 transition-all group`}
        >
            <span className={`${c.icon} transition-colors`}>{icon}</span>
            <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900">{label}</span>
        </Link>
    );
}

function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        PENDING: 'bg-amber-400',
        CONFIRMED: 'bg-blue-400',
        PACKED: 'bg-violet-400',
        SHIPPED: 'bg-sky-400',
        DELIVERED: 'bg-emerald-400',
        CANCELLED: 'bg-red-400',
        RETURNED: 'bg-orange-400',
        REFUNDED: 'bg-rose-400',
    };
    return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[status] || 'bg-stone-300'}`} />;
}

function OrderStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: 'bg-amber-50 text-amber-700',
        CONFIRMED: 'bg-blue-50 text-blue-700',
        PACKED: 'bg-violet-50 text-violet-700',
        SHIPPED: 'bg-sky-50 text-sky-700',
        DELIVERED: 'bg-emerald-50 text-emerald-700',
        CANCELLED: 'bg-red-50 text-red-700',
        RETURNED: 'bg-orange-50 text-orange-700',
        REFUNDED: 'bg-rose-50 text-rose-700',
    };
    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
            {status}
        </span>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
