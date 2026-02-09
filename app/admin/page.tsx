import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Package,
    Truck,
    CheckCircle,
    AlertTriangle,
    Calendar,

    Plus,
    Eye,
    FolderOpen
} from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "@/components/notifications/NotificationBell";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const session = await auth();

    // Date helpers
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setMilliseconds(-1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Fetch all metrics
    const [
        todaySales,
        todayOrdersCount,
        yesterdaySales,
        yesterdayOrdersCount,
        totalRevenue,
        totalOrdersCount,
        pendingOrdersCount,
        shippedOrdersCount,
        deliveredOrdersCount,
        monthlyRevenue,
        lastMonthRevenue,
        totalProductsCount,
        totalCustomersCount,
        lowStockCount,
        recentOrders,
        bestSellers,
        categoryStats,
        dailyRevenue,
        dailyOrders
    ] = await Promise.all([
        // Today's sales
        prisma.order.aggregate({
            where: { createdAt: { gte: todayStart } },
            _sum: { total: true }
        }),
        // Today's orders
        prisma.order.count({
            where: { createdAt: { gte: todayStart } }
        }),
        // Yesterday's sales
        prisma.order.aggregate({
            where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
            _sum: { total: true }
        }),
        // Yesterday's orders
        prisma.order.count({
            where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } }
        }),
        // Total revenue (for AOV calculation)
        prisma.order.aggregate({
            _sum: { total: true }
        }),
        // Total orders (for AOV calculation)
        prisma.order.count(),
        // Pending orders
        prisma.order.count({
            where: { status: 'PENDING' }
        }),
        // Shipped orders
        prisma.order.count({
            where: { status: 'SHIPPED' }
        }),
        // Delivered orders
        prisma.order.count({
            where: { status: 'DELIVERED' }
        }),
        // Monthly revenue
        prisma.order.aggregate({
            where: { createdAt: { gte: monthStart } },
            _sum: { total: true }
        }),
        // Last month revenue
        prisma.order.aggregate({
            where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            _sum: { total: true }
        }),
        // Total products
        prisma.product.count(),
        // Total customers
        prisma.user.count({
            where: { role: 'USER' }
        }),
        // Low stock alerts
        prisma.product.count({
            where: { stock: { lt: 10 } }
        }),
        // Recent orders
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        }),
        // Best sellers
        prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        }),
        // Category stats for most popular
        prisma.product.groupBy({
            by: ['categoryId'],
            _count: true,
            orderBy: { _count: { categoryId: 'desc' } },
            take: 1
        }),
        // Daily revenue for last 30 days
        prisma.order.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true, total: true }
        }),
        // Daily orders for last 30 days
        prisma.order.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        })
    ]);

    // Get product details for best sellers
    const bestSellerProducts = await prisma.product.findMany({
        where: { id: { in: bestSellers.map(bs => bs.productId) } },
        select: {
            id: true,
            name: true,
            price: true,
            images: {
                orderBy: { position: 'asc' },
                take: 1,
                select: {
                    url: true
                }
            }
        }
    });

    // Get category details for most popular
    const mostPopularCategory = categoryStats.length > 0
        ? await prisma.category.findUnique({
            where: { id: categoryStats[0].categoryId },
            select: { name: true, id: true }
        })
        : null;

    // Calculate metrics
    const averageOrderValue = totalOrdersCount > 0
        ? Number(totalRevenue._sum.total || 0) / totalOrdersCount
        : 0;

    // Calculate trend percentages
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100' : '0';
        const change = ((current - previous) / previous) * 100;
        return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
    };

    const todaySalesValue = Number(todaySales._sum.total || 0);
    const yesterdaySalesValue = Number(yesterdaySales._sum.total || 0);
    const monthlyRevenueValue = Number(monthlyRevenue._sum.total || 0);
    const lastMonthRevenueValue = Number(lastMonthRevenue._sum.total || 0);

    const salesTrend = calculateTrend(todaySalesValue, yesterdaySalesValue);
    const ordersTrend = calculateTrend(todayOrdersCount, yesterdayOrdersCount);
    const monthlyRevenueTrend = calculateTrend(monthlyRevenueValue, lastMonthRevenueValue);

    // Process daily data for graphs
    const revenueByDay = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);

        const dayRevenue = dailyRevenue
            .filter(order => {
                const orderDate = new Date(order.createdAt);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === date.getTime();
            })
            .reduce((sum, order) => sum + Number(order.total), 0);

        return { date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), value: dayRevenue };
    });

    const ordersByDay = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);

        const dayOrders = dailyOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === date.getTime();
        }).length;

        return { date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), value: dayOrders };
    });

    const maxRevenue = Math.max(...revenueByDay.map(d => d.value), 1);
    const maxOrders = Math.max(...ordersByDay.map(d => d.value), 1);

    return (
        <div className="space-y-6">
            {/* Header with Welcome Message */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-[#1C1917]">Dashboard</h1>
                    <p className="text-stone-600 mt-1">
                        Welcome back, {session?.user?.name || 'Admin'} 👋
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-stone-500">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/admin/products/add"
                    className="flex items-center gap-3 p-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add New Saree</span>
                </Link>
                <Link
                    href="/admin/orders"
                    className="flex items-center gap-3 p-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">View Pending Orders</span>
                </Link>
                <Link
                    href="/admin/categories"
                    className="flex items-center gap-3 p-4 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors"
                >
                    <FolderOpen className="w-5 h-5" />
                    <span className="font-medium">Manage Collections</span>
                </Link>
            </div>

            {/* Metrics Grid - 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                    title="Today's Sales"
                    value={`₹${Number(todaySales._sum.total || 0).toLocaleString()}`}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend={`${salesTrend}%`}
                    trendUp={parseFloat(salesTrend) >= 0}
                />
                <MetricCard
                    title="Today's Orders"
                    value={todayOrdersCount.toString()}
                    icon={<ShoppingBag className="h-4 w-4" />}
                    trend={`${ordersTrend}%`}
                    trendUp={parseFloat(ordersTrend) >= 0}
                />
                <MetricCard
                    title="Average Order Value"
                    value={`₹${Math.round(averageOrderValue).toLocaleString()}`}
                    icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                    title="Pending Orders"
                    value={pendingOrdersCount.toString()}
                    icon={<Package className="h-4 w-4" />}
                    iconColor="text-amber-600"
                />
                <MetricCard
                    title="Shipped Orders"
                    value={shippedOrdersCount.toString()}
                    icon={<Truck className="h-4 w-4" />}
                    iconColor="text-blue-600"
                />
                <MetricCard
                    title="Delivered Orders"
                    value={deliveredOrdersCount.toString()}
                    icon={<CheckCircle className="h-4 w-4" />}
                    iconColor="text-green-600"
                />
                <MetricCard
                    title="Monthly Revenue"
                    value={`₹${Number(monthlyRevenue._sum.total || 0).toLocaleString()}`}
                    icon={<Calendar className="h-4 w-4" />}
                    trend={`${monthlyRevenueTrend}%`}
                    trendUp={parseFloat(monthlyRevenueTrend) >= 0}
                />
                <MetricCard
                    title="Total Products"
                    value={totalProductsCount.toString()}
                    icon={<ShoppingBag className="h-4 w-4" />}
                />
                <MetricCard
                    title="Total Customers"
                    value={totalCustomersCount.toString()}
                    icon={<Users className="h-4 w-4" />}
                />
                <MetricCard
                    title="Low Stock Alerts"
                    value={lowStockCount.toString()}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    iconColor="text-red-600"
                />
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Graph */}
                <div className="bg-white p-6 rounded-lg border border-stone-200">
                    <h3 className="text-lg font-medium mb-4">Revenue Trend (Last 30 Days)</h3>
                    <div className="h-48 flex items-end gap-1">
                        {revenueByDay.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t relative group">
                                    <div
                                        className="w-full bg-primary rounded-t"
                                        style={{ height: `${(day.value / maxRevenue) * 180}px` }}
                                    ></div>
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        ₹{Math.round(day.value).toLocaleString()}
                                    </div>
                                </div>
                                {i % 5 === 0 && (
                                    <span className="text-[8px] text-stone-400 rotate-45 origin-left">{day.date}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-stone-600">
                            Total: ₹{revenueByDay.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                        </span>
                        <span className="text-stone-600">
                            Avg: ₹{Math.round(revenueByDay.reduce((sum, d) => sum + d.value, 0) / 30).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Orders Trend Graph */}
                <div className="bg-white p-6 rounded-lg border border-stone-200">
                    <h3 className="text-lg font-medium mb-4">Orders Trend (Last 30 Days)</h3>
                    <div className="h-48 flex items-end gap-1">
                        {ordersByDay.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-amber-100 hover:bg-amber-200 transition-colors rounded-t relative group">
                                    <div
                                        className="w-full bg-amber-600 rounded-t"
                                        style={{ height: `${(day.value / maxOrders) * 180}px` }}
                                    ></div>
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {day.value} orders
                                    </div>
                                </div>
                                {i % 5 === 0 && (
                                    <span className="text-[8px] text-stone-400 rotate-45 origin-left">{day.date}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-stone-600">
                            Total: {ordersByDay.reduce((sum, d) => sum + d.value, 0)} orders
                        </span>
                        <span className="text-stone-600">
                            Avg: {Math.round(ordersByDay.reduce((sum, d) => sum + d.value, 0) / 30)} per day
                        </span>
                    </div>
                </div>
            </div>

            {/* Best Sellers & Popular Collection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Selling Sarees */}
                <div className="bg-white p-6 rounded-lg border border-stone-200">
                    <h3 className="text-lg font-medium mb-4">Best Selling Sarees</h3>
                    {bestSellerProducts.length === 0 ? (
                        <p className="text-sm text-stone-500">No sales data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {bestSellers.map((seller, index) => {
                                const product = bestSellerProducts.find(p => p.id === seller.productId);
                                if (!product) return null;

                                return (
                                    <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded transition-colors">
                                        <div className="flex-shrink-0 w-12 h-12 bg-stone-100 rounded overflow-hidden relative">
                                            {product.images[0] && (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-800 truncate">{product.name}</p>
                                            <p className="text-xs text-stone-500">₹{Number(product.price).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-primary">{seller._sum.quantity}</p>
                                            <p className="text-xs text-stone-500">sold</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Most Popular Collection */}
                <div className="bg-white p-6 rounded-lg border border-stone-200">
                    <h3 className="text-lg font-medium mb-4">Most Popular Collection</h3>
                    {mostPopularCategory ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                <FolderOpen className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="text-2xl font-serif text-stone-800 mb-2">{mostPopularCategory.name}</h4>
                            <p className="text-stone-600">
                                {categoryStats[0]._count} products in this collection
                            </p>
                            <Link
                                href={`/admin/categories`}
                                className="inline-block mt-4 text-sm text-primary hover:underline"
                            >
                                View Collection →
                            </Link>
                        </div>
                    ) : (
                        <p className="text-sm text-stone-500 text-center py-8">No collections yet.</p>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h3 className="text-lg font-medium mb-4">Recent Orders</h3>
                {recentOrders.length === 0 ? (
                    <div className="text-sm text-stone-500">No orders yet.</div>
                ) : (
                    <div className="space-y-4">
                        {recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                                <div>
                                    <p className="font-medium text-sm">{order.user?.name || order.user?.email || 'Guest'}</p>
                                    <p className="text-xs text-stone-500">{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-sm">₹{Number(order.total).toLocaleString()}</p>
                                    <p className="text-xs text-stone-500">{order.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    icon,
    trend,
    trendUp,
    iconColor = "text-stone-500"
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    iconColor?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">{title}</CardTitle>
                <div className={iconColor}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold text-[#1C1917]">{value}</div>
                {trend && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
