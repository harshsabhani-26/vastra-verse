import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { BarChart3, TrendingUp, TrendingDown, Clock, Award } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCourierAnalytics() {
    const couriers = await prisma.courierPerformance.findMany({
        orderBy: { score: "desc" },
    });

    return couriers.map((c) => ({
        name: c.courierName,
        score: Number(c.score),
        successRate: Number(c.successRate),
        rtoRate: Number(c.rtoRate),
        avgDeliveryTime: Number(c.avgDeliveryTime),
        totalShipments: c.totalShipments,
    }));
}

export default async function CourierAnalyticsPage() {
    const couriers = await getCourierAnalytics();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-serif text-[#1C1917]">Courier Analytics</h2>
                <p className="text-stone-600 mt-1">
                    Performance metrics and insights for all courier partners
                </p>
            </div>

            {couriers.length === 0 ? (
                <Card className="p-8 text-center text-stone-500">
                    No courier performance data available yet. Data will appear after shipments are delivered.
                </Card>
            ) : (
                <div className="space-y-4">
                    {couriers.map((courier, index) => (
                        <Card key={courier.name} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {index === 0 && (
                                        <Award className="h-6 w-6 text-yellow-500" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold">{courier.name}</h3>
                                        <p className="text-sm text-stone-500">
                                            {courier.totalShipments} shipments processed
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-stone-600">Overall Score</p>
                                    <p className="text-3xl font-bold">{courier.score.toFixed(1)}</p>
                                    <p className="text-xs text-stone-500">out of 100</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <MetricCard
                                    icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                                    label="Success Rate"
                                    value={`${courier.successRate.toFixed(1)}%`}
                                    bgColor="bg-green-50"
                                />
                                <MetricCard
                                    icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                                    label="RTO Rate"
                                    value={`${courier.rtoRate.toFixed(1)}%`}
                                    bgColor="bg-red-50"
                                />
                                <MetricCard
                                    icon={<Clock className="h-5 w-5 text-blue-600" />}
                                    label="Avg Delivery Time"
                                    value={`${courier.avgDeliveryTime.toFixed(1)} days`}
                                    bgColor="bg-blue-50"
                                />
                            </div>

                            {/* Visual Progress Bars */}
                            <div className="mt-4 space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Success Rate</span>
                                        <span>{courier.successRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${courier.successRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    bgColor: string;
}) {
    return (
        <div className={`p-4 rounded-lg ${bgColor}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <p className="text-sm text-stone-600">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
