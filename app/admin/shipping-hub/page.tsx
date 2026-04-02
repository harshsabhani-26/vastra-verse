import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
    Truck,
    IndianRupee,
    Settings,
    MapPin,
    TrendingUp,
    AlertTriangle,
    LayoutDashboard,
    Lock,
} from "lucide-react";

export default function ShippingHubPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Shipping Management</h2>
                <p className="text-stone-600 mt-1">
                    Manage shipments, track deliveries, and handle logistics
                </p>
            </div>

            {/* Active — Working Now */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">Active</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <HubCard
                        icon={<LayoutDashboard className="h-6 w-6" />}
                        title="Shipping Dashboard"
                        description="KPI overview, shipments table, filters, and bulk pickup scheduling"
                        link="/admin/dashboard/shipping"
                        color="bg-teal-50 text-teal-600"
                    />
                    <HubCard
                        icon={<AlertTriangle className="h-6 w-6" />}
                        title="NDR Management"
                        description="Handle failed delivery attempts — re-attempt, RTO, or update address"
                        link="/admin/dashboard/ndr"
                        color="bg-red-50 text-red-600"
                    />
                </div>
            </div>

            {/* Coming Soon */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">Coming Soon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ComingSoonCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title="Courier Analytics"
                        description="Performance metrics and delivery success rates"
                        color="bg-purple-50 text-purple-600"
                    />
                    <ComingSoonCard
                        icon={<IndianRupee className="h-6 w-6" />}
                        title="COD Reconciliation"
                        description="Track and settle cash-on-delivery payments"
                        color="bg-yellow-50 text-yellow-600"
                    />
                    <ComingSoonCard
                        icon={<Truck className="h-6 w-6" />}
                        title="Courier Partners"
                        description="Manage shipping partners and configurations"
                        color="bg-indigo-50 text-indigo-600"
                    />
                    <ComingSoonCard
                        icon={<MapPin className="h-6 w-6" />}
                        title="Shipping Zones"
                        description="Configure delivery zones and rates"
                        color="bg-cyan-50 text-cyan-600"
                    />
                    <ComingSoonCard
                        icon={<Settings className="h-6 w-6" />}
                        title="Shipping Settings"
                        description="Automation rules and default parameters"
                        color="bg-stone-100 text-stone-600"
                    />
                </div>
            </div>
        </div>
    );
}

/* ─── Active Card (clickable) ─────────────────────────────────────────────── */

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
            <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full border-stone-200">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-[#1C1917] mb-1">{title}</h4>
                        <p className="text-sm text-stone-600 mb-3">{description}</p>
                        <p className="text-sm text-blue-600 font-medium">Open →</p>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

/* ─── Coming Soon Card (not clickable, greyed out badge) ──────────────────── */

function ComingSoonCard({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <Card className="p-6 h-full border-stone-200 opacity-60 cursor-default">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#1C1917]">{title}</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            <Lock className="w-2.5 h-2.5" />
                            Soon
                        </span>
                    </div>
                    <p className="text-sm text-stone-500">{description}</p>
                </div>
            </div>
        </Card>
    );
}
