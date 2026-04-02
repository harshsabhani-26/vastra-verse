"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import * as Checkbox from "@radix-ui/react-checkbox";
import {
    Package, Truck, CheckCircle2, Clock, AlertTriangle, TrendingDown,
    Search, ChevronDown, ChevronLeft, ChevronRight, Check, CalendarClock,
    Loader2, RotateCcw, Eye,
} from "lucide-react";
import Link from "next/link";
import { useShippingStore } from "@/lib/stores/shipping-store";
import type { ShipmentKPIs } from "@/lib/stores/shipping-store";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "READY_TO_SHIP", label: "Ready to Ship" },
    { value: "PICKUP_SCHEDULED", label: "Pickup Scheduled" },
    { value: "IN_TRANSIT", label: "In Transit" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "FAILED", label: "Failed" },
    { value: "RTO_INITIATED", label: "RTO Initiated" },
    { value: "RETURN_INITIATED", label: "Return Initiated" },
];

const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    READY_TO_SHIP: "bg-blue-100 text-blue-700",
    LABEL_GENERATED: "bg-sky-100 text-sky-700",
    PICKUP_SCHEDULED: "bg-violet-100 text-violet-700",
    PICKED_UP: "bg-indigo-100 text-indigo-700",
    IN_TRANSIT: "bg-amber-100 text-amber-700",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    DELIVERY_ATTEMPTED: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-red-100 text-red-700",
    RTO_INITIATED: "bg-orange-100 text-orange-700",
    RETURN_INITIATED: "bg-purple-100 text-purple-700",
    RETURN_PICKED: "bg-purple-100 text-purple-700",
    RETURN_DELIVERED: "bg-blue-100 text-blue-700",
};

function AnimatedCounter({ value }: { value: number }) {
    const [displayed, setDisplayed] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (!isInView) return;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / 1200, 1);
            setDisplayed(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [value, isInView]);
    return <span ref={ref}>{displayed}</span>;
}

function KPICard({ icon: Icon, label, value, color, bgColor, index }: {
    icon: React.ElementType; label: string; value: number; color: string; bgColor: string; index: number;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-stone-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-stone-900"><AnimatedCounter value={value} /></p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
        </motion.div>
    );
}

export default function ShippingDashboardPage() {
    const store = useShippingStore();
    const [searchInput, setSearchInput] = useState(store.shipmentsFilters.search);
    const [pickupLoading, setPickupLoading] = useState(false);
    const searchTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { store.fetchShipments(); }, []);

    const onSearch = useCallback((v: string) => {
        setSearchInput(v);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => store.setShipmentsFilter({ search: v, page: 1 }), 400);
    }, [store]);

    const handleBulkPickup = async () => {
        setPickupLoading(true);
        const r = await store.bulkSchedulePickup();
        r.success ? toast.success(`Pickup scheduled for ${r.count} shipment(s)`) : toast.error(r.error || "Failed");
        setPickupLoading(false);
    };

    const totalPages = Math.ceil(store.shipmentsTotalCount / store.shipmentsFilters.pageSize);
    const kpiCards: { icon: React.ElementType; label: string; key: keyof ShipmentKPIs; color: string; bgColor: string }[] = [
        { icon: Package, label: "Active Shipments", key: "activeShipments", color: "text-blue-600", bgColor: "bg-blue-50" },
        { icon: CheckCircle2, label: "Delivered Today", key: "deliveredToday", color: "text-emerald-600", bgColor: "bg-emerald-50" },
        { icon: AlertTriangle, label: "Delayed", key: "delayedShipments", color: "text-orange-600", bgColor: "bg-orange-50" },
        { icon: TrendingDown, label: "RTO Initiated", key: "rtoInitiated", color: "text-red-600", bgColor: "bg-red-50" },
        { icon: CalendarClock, label: "Pending Pickups", key: "pendingPickups", color: "text-violet-600", bgColor: "bg-violet-50" },
        { icon: Truck, label: "Total Shipments", key: "totalShipments", color: "text-stone-600", bgColor: "bg-stone-100" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Shipping Dashboard</h2>
                <p className="text-stone-600 mt-1">Manage shipments, schedule pickups, and monitor delivery performance</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpiCards.map((c, i) => <KPICard key={c.key} icon={c.icon} label={c.label} value={store.kpis[c.key]} color={c.color} bgColor={c.bgColor} index={i} />)}
            </div>

            {/* Filters Bar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="relative flex-1 w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input type="text" placeholder="Search by AWB or customer..." value={searchInput}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
                    </div>
                    <Select.Root value={store.shipmentsFilters.status} onValueChange={(v) => store.setShipmentsFilter({ status: v, page: 1 })}>
                        <Select.Trigger className="flex items-center justify-between gap-2 min-w-[180px] rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10">
                            <Select.Value /><Select.Icon><ChevronDown className="w-4 h-4 text-stone-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal><Select.Content className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-50" position="popper" sideOffset={4}>
                            <Select.Viewport className="p-1.5 max-h-72">{STATUS_OPTIONS.map((o) => (
                                <Select.Item key={o.value} value={o.value} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none data-[highlighted]:bg-stone-50">
                                    <Select.ItemText>{o.label}</Select.ItemText>
                                    <Select.ItemIndicator className="ml-auto"><Check className="w-4 h-4 text-emerald-600" /></Select.ItemIndicator>
                                </Select.Item>
                            ))}</Select.Viewport>
                        </Select.Content></Select.Portal>
                    </Select.Root>
                    <button onClick={() => store.fetchShipments()} disabled={store.shipmentsLoading}
                        className="p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50" title="Refresh">
                        <RotateCcw className={`w-4 h-4 text-stone-600 ${store.shipmentsLoading ? "animate-spin" : ""}`} />
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                        {store.selectedShipmentIds.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                                <span className="text-sm text-stone-500">{store.selectedShipmentIds.length} selected</span>
                                <button onClick={handleBulkPickup} disabled={pickupLoading}
                                    className="px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2">
                                    {pickupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}Schedule Pickup
                                </button>
                                <button onClick={store.clearShipmentSelection} className="text-sm text-stone-500 hover:text-stone-700">Clear</button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Shipments Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100">
                            <th className="text-left p-4 w-10">
                                <Checkbox.Root checked={store.selectedShipmentIds.length > 0 && store.selectedShipmentIds.length === store.shipments.filter(s => s.status === "READY_TO_SHIP" || s.status === "LABEL_GENERATED").length}
                                    onCheckedChange={(c) => c ? store.selectAllShipments() : store.clearShipmentSelection()}
                                    className="w-4 h-4 rounded border border-stone-300 flex items-center justify-center data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900">
                                    <Checkbox.Indicator><Check className="w-3 h-3 text-white" /></Checkbox.Indicator>
                                </Checkbox.Root>
                            </th>
                            <th className="text-left p-4 font-medium text-stone-600">AWB</th>
                            <th className="text-left p-4 font-medium text-stone-600">Customer</th>
                            <th className="text-left p-4 font-medium text-stone-600">Status</th>
                            <th className="text-left p-4 font-medium text-stone-600">Courier</th>
                            <th className="text-left p-4 font-medium text-stone-600">Created</th>
                            <th className="text-left p-4 font-medium text-stone-600">EDD</th>
                            <th className="text-right p-4 font-medium text-stone-600">Actions</th>
                        </tr></thead>
                        <tbody>
                            {store.shipmentsLoading && store.shipments.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400 mb-2" /><p className="text-stone-500">Loading shipments...</p>
                                </td></tr>
                            ) : store.shipments.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16">
                                    <Package className="w-8 h-8 mx-auto text-stone-300 mb-2" /><p className="text-stone-500">No shipments found</p>
                                </td></tr>
                            ) : store.shipments.map((s, i) => {
                                const canSelect = s.status === "READY_TO_SHIP" || s.status === "LABEL_GENERATED";
                                return (
                                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                                        <td className="p-4">{canSelect ? (
                                            <Checkbox.Root checked={store.selectedShipmentIds.includes(s.id)} onCheckedChange={() => store.toggleShipmentSelection(s.id)}
                                                className="w-4 h-4 rounded border border-stone-300 flex items-center justify-center data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900">
                                                <Checkbox.Indicator><Check className="w-3 h-3 text-white" /></Checkbox.Indicator>
                                            </Checkbox.Root>
                                        ) : <div className="w-4 h-4" />}</td>
                                        <td className="p-4"><span className="font-mono text-xs text-stone-800">{s.awbNumber || "—"}</span></td>
                                        <td className="p-4 text-stone-800">{s.order.customerName || "—"}</td>
                                        <td className="p-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[s.status] || "bg-gray-100 text-gray-700"}`}>{s.status.replace(/_/g, " ")}</span></td>
                                        <td className="p-4 text-stone-600">{s.courierName || "—"}</td>
                                        <td className="p-4 text-stone-500 text-xs">{new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                                        <td className="p-4 text-stone-500 text-xs">{s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                                        <td className="p-4 text-right">{s.awbNumber && <Link href={`/track/${s.awbNumber}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"><Eye className="w-3.5 h-3.5" />Track</Link>}</td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
                        <p className="text-sm text-stone-500">
                            {(store.shipmentsFilters.page - 1) * store.shipmentsFilters.pageSize + 1}–{Math.min(store.shipmentsFilters.page * store.shipmentsFilters.pageSize, store.shipmentsTotalCount)} of {store.shipmentsTotalCount}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => store.setShipmentsFilter({ page: store.shipmentsFilters.page - 1 })} disabled={store.shipmentsFilters.page <= 1}
                                className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm text-stone-600 px-2">{store.shipmentsFilters.page} / {totalPages}</span>
                            <button onClick={() => store.setShipmentsFilter({ page: store.shipmentsFilters.page + 1 })} disabled={store.shipmentsFilters.page >= totalPages}
                                className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
