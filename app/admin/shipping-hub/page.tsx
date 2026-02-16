import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
    BarChart3,
    Package,
    Truck,
    IndianRupee,
    RotateCcw,
    Settings,
    MapPin,
    TrendingUp,
} from "lucide-react";

export default function ShippingHubPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-serif text-[#1C1917]">Shipping Management</h2>
                <p className="text-stone-600 mt-1">
                    Centralized hub for managing shipments, couriers, and logistics operations
                </p>
            </div>

            {/* Overview & Analytics */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-stone-700">Overview & Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <HubCard
                        icon={<BarChart3 className="h-6 w-6" />}
                        title="Shipping Overview"
                        description="View real-time logistics metrics and operational insights"
                        link="/admin/shipping"
                        color="bg-blue-50 text-blue-600"
                    />
                    <HubCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title="Courier Analytics"
                        description="View detailed performance metrics"
                        link="/admin/shipping/analytics"
                        color="bg-purple-50 text-purple-600"
                    />
                </div>
            </div>

            {/* Operations */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-stone-700">Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <HubCard
                        icon={<Package className="h-6 w-6" />}
                        title="All Shipments"
                        description="Manage all shipments, track deliveries, and monitor courier performance"
                        link="/admin/shipping/shipments"
                        color="bg-green-50 text-green-600"
                    />
                    <HubCard
                        icon={<IndianRupee className="h-6 w-6" />}
                        title="COD Reconciliation"
                        description="Track and settle cash-on-delivery orders"
                        link="/admin/shipping/cod"
                        color="bg-yellow-50 text-yellow-600"
                    />
                    <HubCard
                        icon={<RotateCcw className="h-6 w-6" />}
                        title="Returns Management"
                        description="Handle return shipments and customer returns"
                        link="/admin/shipping/returns"
                        color="bg-orange-50 text-orange-600"
                    />
                </div>
            </div>

            {/* Configuration */}
            <div>
                <h3 className="text-lg font-semibold mb-3 text-stone-700">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <HubCard
                        icon={<Truck className="h-6 w-6" />}
                        title="Courier Partners"
                        description="Manage your shipping partners and their configurations"
                        link="/admin/shipping/couriers"
                        color="bg-indigo-50 text-indigo-600"
                    />
                    <HubCard
                        icon={<MapPin className="h-6 w-6" />}
                        title="Shipping Zones"
                        description="Configure delivery zones and shipping rates"
                        link="/admin/shipping/zones"
                        color="bg-cyan-50 text-cyan-600"
                    />
                    <HubCard
                        icon={<Settings className="h-6 w-6" />}
                        title="Shipping Settings"
                        description="Configure automation rules and default shipping parameters"
                        link="/admin/shipping/settings"
                        color="bg-stone-100 text-stone-600"
                    />
                </div>
            </div>
        </div>
    );
}

function HubCard({
    icon,
    title,
    description,
    link,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    link: string;
    color: string;
}) {
    return (
        <Link href={link}>
            <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-[#1C1917] mb-1">{title}</h4>
                        <p className="text-sm text-stone-600 mb-3">{description}</p>
                        <p className="text-sm text-blue-600 font-medium">
                            Configure →
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
