import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import {
    IndianRupee,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
} from "lucide-react";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getCodFinancials() {
    const [pending, settled, mismatched, totalExpected, totalCollected, totalSettled] = await Promise.all([
        prisma.shipment.count({
            where: {
                order: { paymentMethod: "COD" },
                status: "DELIVERED",
                codSettlementStatus: "PENDING",
            },
        }),
        prisma.shipment.count({
            where: {
                order: { paymentMethod: "COD" },
                status: "DELIVERED",
                codSettlementStatus: "SETTLED",
            },
        }),
        prisma.shipment.count({
            where: {
                order: { paymentMethod: "COD" },
                status: "DELIVERED",
                codSettlementStatus: "DISPUTED",
            },
        }),
        prisma.shipment.aggregate({
            _sum: { codRemittance: true },
            where: {
                order: { paymentMethod: "COD" },
                status: "DELIVERED",
            },
        }),
        prisma.shipment.aggregate({
            _sum: { codCollectedAmount: true },
            where: {
                order: { paymentMethod: "COD" },
                status: "DELIVERED",
            },
        }),
        prisma.shipment.aggregate({
            _sum: { codSettledAmount: true },
            where: {
                order: { paymentMethod: "COD" },
                codSettlementStatus: "SETTLED",
            },
        }),
    ]);

    // Get recent pending settlements
    const recentPending = await prisma.shipment.findMany({
        where: {
            order: { paymentMethod: "COD" },
            status: "DELIVERED",
            OR: [
                { codSettlementStatus: "PENDING" },
                { codSettlementStatus: null },
            ],
        },
        include: {
            order: {
                select: {
                    id: true,
                    customerName: true,
                },
            },
        },
        orderBy: { deliveredAt: "desc" },
        take: 10,
    });

    return {
        pending,
        settled,
        mismatched,
        totalExpected: totalExpected._sum.codRemittance || new Prisma.Decimal(0),
        totalCollected: totalCollected._sum.codCollectedAmount || new Prisma.Decimal(0),
        totalSettled: totalSettled._sum.codSettledAmount || new Prisma.Decimal(0),
        recentPending,
    };
}

export default async function CodFinancialDashboard() {
    const data = await getCodFinancials();

    const expectedAmount = Number(data.totalExpected);
    const collectedAmount = Number(data.totalCollected);
    const settledAmount = Number(data.totalSettled);
    const pendingAmount = collectedAmount - settledAmount;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">COD Financial Dashboard</h2>
                <p className="text-stone-600 mt-1">
                    Monitor cash-on-delivery collections and settlements
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <IndianRupee className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-stone-600">Expected COD</p>
                    </div>
                    <p className="text-2xl font-bold">₹{expectedAmount.toFixed(2)}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-stone-600">Collected</p>
                    </div>
                    <p className="text-2xl font-bold">₹{collectedAmount.toFixed(2)}</p>
                    <p className="text-xs text-stone-500 mt-1">{data.settled} shipments settled</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <p className="text-sm text-stone-600">Pending Settlement</p>
                    </div>
                    <p className="text-2xl font-bold">₹{pendingAmount.toFixed(2)}</p>
                    <p className="text-xs text-stone-500 mt-1">{data.pending} shipments pending</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-sm text-stone-600">Mismatches</p>
                    </div>
                    <p className="text-2xl font-bold">{data.mismatched}</p>
                    <p className="text-xs text-stone-500 mt-1">Require attention</p>
                </Card>
            </div>

            {/* Recent Pending Settlements */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Pending Settlements</h3>
                {data.recentPending.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">
                        No pending COD settlements. Great job!
                    </p>
                ) : (
                    <div className="space-y-3">
                        {data.recentPending.map((shipment) => (
                            <div
                                key={shipment.id}
                                className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:bg-stone-50 transition"
                            >
                                <div>
                                    <p className="font-medium">{shipment.order.customerName}</p>
                                    <p className="text-sm text-stone-500">
                                        Order: {shipment.orderId.slice(0, 8)}... • AWB: {shipment.awbNumber || "—"}
                                    </p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        Delivered: {shipment.deliveredAt ? new Date(shipment.deliveredAt).toLocaleDateString() : "—"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">
                                        ₹{Number(shipment.codRemittance || 0).toFixed(2)}
                                    </p>
                                    <Badge variant="outline">{shipment.codSettlementStatus || "PENDING"}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
