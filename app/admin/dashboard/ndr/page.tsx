"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as Select from "@radix-ui/react-select";
import {
    AlertTriangle, Search, ChevronDown, ChevronLeft, ChevronRight,
    Check, Loader2, RotateCcw, Phone, Clock, CheckCircle2,
} from "lucide-react";
import { useShippingStore } from "@/lib/stores/shipping-store";
import type { NdrEventRow } from "@/lib/stores/shipping-store";
import NdrActionModal from "@/components/shipping/NdrActionModal";
import { toast } from "react-hot-toast";

const ACTION_STATUS_OPTIONS = [
    { value: "all", label: "All NDR Events" },
    { value: "pending", label: "Pending Action" },
    { value: "resolved", label: "Resolved" },
];

const NDR_ACTION_LABELS: Record<string, { label: string; color: string }> = {
    RE_ATTEMPT: { label: "Re-attempt", color: "bg-blue-100 text-blue-700" },
    RTO: { label: "RTO", color: "bg-orange-100 text-orange-700" },
    ADDRESS_UPDATE: { label: "Address Updated", color: "bg-violet-100 text-violet-700" },
    CALL_CUSTOMER: { label: "Called Customer", color: "bg-emerald-100 text-emerald-700" },
    CANCEL: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export default function NdrDashboardPage() {
    const store = useShippingStore();
    const [selectedEvent, setSelectedEvent] = useState<NdrEventRow | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => { store.fetchNdrEvents(); }, []);

    const onSearch = (v: string) => {
        setSearchInput(v);
        // Immediate search for NDR (usually smaller dataset)
        store.setNdrFilter({ search: v, page: 1 });
    };

    const handleResolve = async (id: string, action: string, notes: string) => {
        const result = await store.resolveNdr(id, action, notes);
        if (result.success) toast.success("NDR resolved successfully");
        else toast.error(result.error || "Failed to resolve NDR");
        return result;
    };

    const openModal = (event: NdrEventRow) => {
        setSelectedEvent(event);
        setModalOpen(true);
    };

    const totalPages = Math.ceil(store.ndrTotalCount / store.ndrFilters.pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917] flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    NDR Management
                </h2>
                <p className="text-stone-600 mt-1">
                    Non-Delivery Reports — track failed delivery attempts and take action
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500">Total NDR Events</p>
                            <p className="text-xl font-bold text-stone-900">{store.ndrTotalCount}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500">Pending Action</p>
                            <p className="text-xl font-bold text-stone-900">
                                {store.ndrEvents.filter(e => !e.actionTaken).length}
                            </p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                    className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500">Resolved</p>
                            <p className="text-xl font-bold text-stone-900">
                                {store.ndrEvents.filter(e => e.actionTaken).length}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="relative flex-1 w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input type="text" placeholder="Search by AWB..." value={searchInput}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
                    </div>
                    <Select.Root value={store.ndrFilters.actionStatus} onValueChange={(v: any) => store.setNdrFilter({ actionStatus: v, page: 1 })}>
                        <Select.Trigger className="flex items-center justify-between gap-2 min-w-[180px] rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10">
                            <Select.Value /><Select.Icon><ChevronDown className="w-4 h-4 text-stone-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal><Select.Content className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-50" position="popper" sideOffset={4}>
                            <Select.Viewport className="p-1.5">{ACTION_STATUS_OPTIONS.map((o) => (
                                <Select.Item key={o.value} value={o.value} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none data-[highlighted]:bg-stone-50">
                                    <Select.ItemText>{o.label}</Select.ItemText>
                                    <Select.ItemIndicator className="ml-auto"><Check className="w-4 h-4 text-emerald-600" /></Select.ItemIndicator>
                                </Select.Item>
                            ))}</Select.Viewport>
                        </Select.Content></Select.Portal>
                    </Select.Root>
                    <button onClick={() => store.fetchNdrEvents()} disabled={store.ndrLoading}
                        className="p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50" title="Refresh">
                        <RotateCcw className={`w-4 h-4 text-stone-600 ${store.ndrLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* NDR Events Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-stone-100">
                            <th className="text-left p-4 font-medium text-stone-600">AWB</th>
                            <th className="text-left p-4 font-medium text-stone-600">Customer</th>
                            <th className="text-left p-4 font-medium text-stone-600">NDR Reason</th>
                            <th className="text-left p-4 font-medium text-stone-600">Attempt Date</th>
                            <th className="text-left p-4 font-medium text-stone-600">Action</th>
                            <th className="text-right p-4 font-medium text-stone-600">Resolve</th>
                        </tr></thead>
                        <tbody>
                            {store.ndrLoading && store.ndrEvents.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400 mb-2" />
                                    <p className="text-stone-500">Loading NDR events...</p>
                                </td></tr>
                            ) : store.ndrEvents.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16">
                                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-300 mb-2" />
                                    <p className="text-stone-500">No NDR events found</p>
                                </td></tr>
                            ) : store.ndrEvents.map((ev, i) => {
                                const actionConfig = ev.actionTaken ? NDR_ACTION_LABELS[ev.actionTaken] : null;
                                return (
                                    <motion.tr key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors cursor-pointer"
                                        onClick={() => openModal(ev)}>
                                        <td className="p-4"><span className="font-mono text-xs text-stone-800">{ev.awbNumber}</span></td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-stone-800">{ev.shipment.order.customerName || "—"}</p>
                                                {ev.shipment.order.customerPhone && (
                                                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3" />{ev.shipment.order.customerPhone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-stone-700 text-sm">{ev.ndrReason}</p>
                                            <p className="text-xs text-stone-400 mt-0.5">Code: {ev.ndrCode}</p>
                                        </td>
                                        <td className="p-4 text-stone-500 text-xs">
                                            {new Date(ev.attemptDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="p-4">
                                            {actionConfig ? (
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${actionConfig.color}`}>
                                                    {actionConfig.label}
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={(e) => { e.stopPropagation(); openModal(ev); }}
                                                className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors">
                                                {ev.actionTaken ? "View" : "Take Action"}
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
                        <p className="text-sm text-stone-500">
                            {(store.ndrFilters.page - 1) * store.ndrFilters.pageSize + 1}–{Math.min(store.ndrFilters.page * store.ndrFilters.pageSize, store.ndrTotalCount)} of {store.ndrTotalCount}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => store.setNdrFilter({ page: store.ndrFilters.page - 1 })} disabled={store.ndrFilters.page <= 1}
                                className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm text-stone-600 px-2">{store.ndrFilters.page} / {totalPages}</span>
                            <button onClick={() => store.setNdrFilter({ page: store.ndrFilters.page + 1 })} disabled={store.ndrFilters.page >= totalPages}
                                className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* NDR Action Modal */}
            <NdrActionModal event={selectedEvent} open={modalOpen} onOpenChange={setModalOpen} onResolve={handleResolve} />
        </div>
    );
}
