import { Suspense } from "react";
import prisma from "@/lib/prisma";
import ShipmentsTable from "@/components/admin/shipping/ShipmentsTable";
import { Card } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, Truck, AlertTriangle, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

async function getShipmentStats() {
    const [total, delivered, inTransit, rto, codPending, totalShippingCost] = await Promise.all([
        prisma.shipment.count(),
        prisma.shipment.count({ where: { status: "DELIVERED" } }),
        prisma.shipment.count({ where: { status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
        prisma.shipment.count({ where: { status: { in: ["RETURN_INITIATED", "RETURN_PICKED", "RETURN_DELIVERED"] } } }),
        prisma.shipment.count({
            where: {
                status: "DELIVERED",
                order: { paymentMethod: "COD" },
                codSettlementStatus: "PENDING",
            },
        }),
        prisma.shipment.aggregate({
            _sum: { shippingCost: true },
        }),
    ]);

    const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0";
    const rtoRate = total > 0 ? ((rto / total) * 100).toFixed(1) : "0";

    return {
        total,
        delivered,
        inTransit,
        rto,
        successRate,
        rtoRate,
        codPending,
        totalShippingCost: totalShippingCost._sum.shippingCost || 0,
    };
}

async function getShipments() {
    return await prisma.shipment.findMany({
        include: {
            order: {
                select: {
                    paymentMethod: true,
                    total: true,
                    customerName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 100, // Limit for performance
    });
}

export default async function ShipmentsPage() {
    const [stats, shipments] = await Promise.all([getShipmentStats(), getShipments()]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Master Shipment Dashboard</h2>
                <p className="text-stone-600 mt-1">
                    Manage all shipments, track deliveries, and monitor courier performance
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Package className="h-5 w-5 text-blue-600" />}
                    label="Total Shipments"
                    value={stats.total}
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                    label="Success Rate"
                    value={`${stats.successRate}%`}
                    subtitle={`${stats.delivered} delivered`}
                    bgColor="bg-green-50"
                />
                <StatCard
                    icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                    label="RTO Rate"
                    value={`${stats.rtoRate}%`}
                    subtitle={`${stats.rto} returns`}
                    bgColor="bg-red-50"
                />
                <StatCard
                    icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
                    label="COD Pending"
                    value={stats.codPending}
                    subtitle="Settlements pending"
                    bgColor="bg-orange-50"
                />
                <StatCard
                    icon={<Truck className="h-5 w-5 text-purple-600" />}
                    label="In Transit"
                    value={stats.inTransit}
                    bgColor="bg-purple-50"
                />
                <StatCard
                    icon={<IndianRupee className="h-5 w-5 text-yellow-600" />}
                    label="Total Shipping Cost"
                    value={`₹${Number(stats.totalShippingCost).toFixed(2)}`}
                    bgColor="bg-yellow-50"
                />
            </div>

            {/* Table */}
            <Suspense fallback={<div>Loading shipments...</div>}>
                <ShipmentsTable initialShipments={shipments as any} />
            </Suspense>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    subtitle,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    bgColor: string;
}) {
    return (
        <Card className="p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-stone-600">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
            </div>
        </Card>
    );
}
