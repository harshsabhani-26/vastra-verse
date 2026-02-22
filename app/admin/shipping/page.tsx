import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    Package,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Truck,
    IndianRupee,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getOverviewMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
        activeShipments,
        deliveredToday,
        delayed,
        rtoInitiated,
        codPending,
        recentShipments,
        courierStats,
    ] = await Promise.all([
        // Active shipments (not delivered/cancelled)
        prisma.shipment.count({
            where: {
                status: {
                    notIn: ["DELIVERED", "CANCELLED", "FAILED", "RETURN_DELIVERED"],
                },
            },
        }),
        // Delivered today
        prisma.shipment.count({
            where: {
                status: "DELIVERED",
                deliveredAt: { gte: today },
            },
        }),
        // Delayed shipments (estimated delivery passed)
        prisma.shipment.count({
            where: {
                status: {
                    in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"],
                },
                estimatedDeliveryAt: { lt: now },
            },
        }),
        // RTO initiated
        prisma.shipment.count({
            where: {
                status: {
                    in: ["RETURN_INITIATED", "RETURN_PICKED"],
                },
            },
        }),
        // COD pending settlement
        prisma.shipment.count({
            where: {
                status: "DELIVERED",
                order: { paymentMethod: "COD" },
                codSettlementStatus: "PENDING",
            },
        }),
        // Recent shipments for trend
        prisma.shipment.findMany({
            where: {
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: {
                createdAt: true,
                status: true,
                deliveredAt: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        // Courier performance summary
        prisma.courierPerformance.findMany({
            orderBy: { score: "desc" },
            take: 5,
        }),
    ]);

    // Calculate average delivery time
    const deliveredShipments = recentShipments.filter((s) => s.status === "DELIVERED");
    const avgDeliveryTime =
        deliveredShipments.length > 0
            ? deliveredShipments.reduce((acc, s) => {
                if (s.deliveredAt && s.createdAt) {
                    const diff = s.deliveredAt.getTime() - s.createdAt.getTime();
                    return acc + diff / (1000 * 60 * 60 * 24);
                }
                return acc;
            }, 0) / deliveredShipments.length
            : 0;

    return {
        activeShipments,
        deliveredToday,
        delayed,
        rtoInitiated,
        codPending,
        avgDeliveryTime,
        courierStats: courierStats.map((c) => ({
            name: c.courierName,
            score: Number(c.score),
            successRate: Number(c.successRate),
        })),
    };
}

export default async function ShippingOverviewPage() {
    const metrics = await getOverviewMetrics();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Shipping Overview</h2>
                    <p className="text-stone-600 mt-1">
                        Real-time logistics metrics and operational insights
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/shipping/shipments">
                        View All Shipments
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                    icon={<Package className="h-6 w-6 text-blue-600" />}
                    label="Active Shipments"
                    value={metrics.activeShipments}
                    subtitle="Currently in transit"
                    bgColor="bg-blue-50"
                    link="/admin/shipping/shipments"
                />
                <MetricCard
                    icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
                    label="Delivered Today"
                    value={metrics.deliveredToday}
                    subtitle="Successful deliveries"
                    bgColor="bg-green-50"
                />
                <MetricCard
                    icon={<Clock className="h-6 w-6 text-purple-600" />}
                    label="Avg Delivery Time"
                    value={`${metrics.avgDeliveryTime.toFixed(1)} days`}
                    subtitle="Last 7 days"
                    bgColor="bg-purple-50"
                />
                <MetricCard
                    icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
                    label="Delayed Shipments"
                    value={metrics.delayed}
                    subtitle="Past estimated delivery"
                    bgColor="bg-orange-50"
                    alert={metrics.delayed > 0}
                />
                <MetricCard
                    icon={<TrendingDown className="h-6 w-6 text-red-600" />}
                    label="RTO Initiated"
                    value={metrics.rtoInitiated}
                    subtitle="Returns in progress"
                    bgColor="bg-red-50"
                    alert={metrics.rtoInitiated > 0}
                />
                <MetricCard
                    icon={<IndianRupee className="h-6 w-6 text-yellow-600" />}
                    label="COD Pending"
                    value={metrics.codPending}
                    subtitle="Awaiting settlement"
                    bgColor="bg-yellow-50"
                    link="/admin/shipping/cod"
                />
            </div>

            {/* Operational Alerts */}
            {(metrics.delayed > 0 || metrics.rtoInitiated > 0) && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                    <div className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900">
                                    Operational Alerts
                                </h3>
                                <div className="mt-2 space-y-1 text-sm text-orange-800">
                                    {metrics.delayed > 0 && (
                                        <p>
                                            • {metrics.delayed} shipment
                                            {metrics.delayed > 1 ? "s are" : " is"} delayed past
                                            estimated delivery date
                                        </p>
                                    )}
                                    {metrics.rtoInitiated > 0 && (
                                        <p>
                                            • {metrics.rtoInitiated} shipment
                                            {metrics.rtoInitiated > 1 ? "s are" : " is"} in RTO
                                            (Return to Origin) process
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" className="mt-3" asChild>
                                    <Link href="/admin/shipping/shipments">Investigate</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Courier Performance Summary */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Top Courier Partners</h3>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/shipping/analytics">
                            View Analytics
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {metrics.courierStats.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">
                        No courier performance data available yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {metrics.courierStats.map((courier, index) => (
                            <div
                                key={courier.name}
                                className="flex items-center justify-between p-3 border border-stone-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{courier.name}</p>
                                        <p className="text-xs text-stone-500">
                                            Success Rate: {courier.successRate.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-stone-600">Score</p>
                                    <p className="text-xl font-bold">{courier.score.toFixed(1)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                    title="Manage Shipments"
                    description="View, filter, and manage all shipments"
                    icon={<Package className="h-5 w-5" />}
                    link="/admin/shipping/shipments"
                />
                <QuickActionCard
                    title="COD Reconciliation"
                    description="Track and settle cash-on-delivery orders"
                    icon={<IndianRupee className="h-5 w-5" />}
                    link="/admin/shipping/cod"
                />
                <QuickActionCard
                    title="Courier Analytics"
                    description="View detailed performance metrics"
                    icon={<Truck className="h-5 w-5" />}
                    link="/admin/shipping/analytics"
                />
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    subtitle,
    bgColor,
    alert = false,
    link,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    bgColor: string;
    alert?: boolean;
    link?: string;
}) {
    const content = (
        <Card className={`p-6 ${alert ? "border-orange-500 border-2" : ""}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-stone-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
            </div>
        </Card>
    );

    return link ? <Link href={link}>{content}</Link> : content;
}

function QuickActionCard({
    title,
    description,
    icon,
    link,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
}) {
    return (
        <Link href={link}>
            <Card className="p-6 hover:bg-stone-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
                    <div>
                        <h4 className="font-semibold mb-1">{title}</h4>
                        <p className="text-sm text-stone-600">{description}</p>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
