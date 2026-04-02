import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShipmentRow {
    id: string;
    orderId: string;
    awbNumber: string | null;
    courierName: string | null;
    status: string;
    isReturn: boolean;
    pickupScheduledAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    estimatedDeliveryAt: string | null;
    shippingCost: number | null;
    profitImpact: number | null;
    createdAt: string;
    order: {
        customerName: string | null;
        paymentMethod: string | null;
        total: number;
    };
}

export interface ShipmentKPIs {
    activeShipments: number;
    deliveredToday: number;
    delayedShipments: number;
    rtoInitiated: number;
    pendingPickups: number;
    totalShipments: number;
}

export interface NdrEventRow {
    id: string;
    shipmentId: string;
    awbNumber: string;
    ndrCode: string;
    ndrReason: string;
    attemptDate: string;
    actionTaken: string | null;
    actionDate: string | null;
    adminNotes: string | null;
    resolvedAt: string | null;
    createdAt: string;
    shipment: {
        orderId: string;
        courierName: string | null;
        status: string;
        order: {
            customerName: string | null;
            customerPhone: string | null;
        };
    };
}

export interface ShippingFilters {
    status: string;
    search: string;
    page: number;
    pageSize: number;
}

export interface NdrFilters {
    actionStatus: 'all' | 'pending' | 'resolved';
    search: string;
    page: number;
    pageSize: number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface ShippingStore {
    // Shipments
    shipments: ShipmentRow[];
    kpis: ShipmentKPIs;
    shipmentsLoading: boolean;
    shipmentsTotalCount: number;
    shipmentsFilters: ShippingFilters;
    selectedShipmentIds: string[];

    // NDR
    ndrEvents: NdrEventRow[];
    ndrLoading: boolean;
    ndrTotalCount: number;
    ndrFilters: NdrFilters;

    // Shipment Actions
    fetchShipments: () => Promise<void>;
    setShipmentsFilter: (filters: Partial<ShippingFilters>) => void;
    toggleShipmentSelection: (id: string) => void;
    selectAllShipments: () => void;
    clearShipmentSelection: () => void;
    bulkSchedulePickup: () => Promise<{ success: boolean; count?: number; error?: string }>;

    // NDR Actions
    fetchNdrEvents: () => Promise<void>;
    setNdrFilter: (filters: Partial<NdrFilters>) => void;
    resolveNdr: (id: string, action: string, notes: string) => Promise<{ success: boolean; error?: string }>;
}

export const useShippingStore = create<ShippingStore>((set, get) => ({
    // ─── Initial State ───────────────────────────────────────────────────────
    shipments: [],
    kpis: {
        activeShipments: 0,
        deliveredToday: 0,
        delayedShipments: 0,
        rtoInitiated: 0,
        pendingPickups: 0,
        totalShipments: 0,
    },
    shipmentsLoading: false,
    shipmentsTotalCount: 0,
    shipmentsFilters: { status: 'all', search: '', page: 1, pageSize: 20 },
    selectedShipmentIds: [],

    ndrEvents: [],
    ndrLoading: false,
    ndrTotalCount: 0,
    ndrFilters: { actionStatus: 'all', search: '', page: 1, pageSize: 20 },

    // ─── Shipment Actions ────────────────────────────────────────────────────

    fetchShipments: async () => {
        const { shipmentsFilters } = get();
        set({ shipmentsLoading: true });

        try {
            const params = new URLSearchParams({
                page: String(shipmentsFilters.page),
                pageSize: String(shipmentsFilters.pageSize),
                ...(shipmentsFilters.status !== 'all' && { status: shipmentsFilters.status }),
                ...(shipmentsFilters.search && { search: shipmentsFilters.search }),
            });

            const res = await fetch(`/api/admin/shipments?${params}`);

            if (!res.ok) {
                // Silently handle — user may not be authorized
                set({
                    shipments: [],
                    kpis: { activeShipments: 0, deliveredToday: 0, delayedShipments: 0, rtoInitiated: 0, pendingPickups: 0, totalShipments: 0 },
                    shipmentsTotalCount: 0,
                    shipmentsLoading: false
                });
                return;
            }

            const data = await res.json();
            set({
                shipments: data.shipments || [],
                kpis: data.kpis || { activeShipments: 0, deliveredToday: 0, delayedShipments: 0, rtoInitiated: 0, pendingPickups: 0, totalShipments: 0 },
                shipmentsTotalCount: data.totalCount || 0,
                shipmentsLoading: false,
            });
        } catch (err) {
            console.warn('[ShippingStore] fetchShipments:', err);
            set({
                shipments: [],
                kpis: { activeShipments: 0, deliveredToday: 0, delayedShipments: 0, rtoInitiated: 0, pendingPickups: 0, totalShipments: 0 },
                shipmentsTotalCount: 0,
                shipmentsLoading: false
            });
        }
    },

    setShipmentsFilter: (filters) => {
        set((state) => ({
            shipmentsFilters: { ...state.shipmentsFilters, ...filters },
            selectedShipmentIds: [],
        }));
        // Auto-fetch after filter change
        get().fetchShipments();
    },

    toggleShipmentSelection: (id) => {
        set((state) => ({
            selectedShipmentIds: state.selectedShipmentIds.includes(id)
                ? state.selectedShipmentIds.filter((s) => s !== id)
                : [...state.selectedShipmentIds, id],
        }));
    },

    selectAllShipments: () => {
        const { shipments } = get();
        const eligibleIds = shipments
            .filter((s) => s.status === 'READY_TO_SHIP' || s.status === 'LABEL_GENERATED')
            .map((s) => s.id);
        set({ selectedShipmentIds: eligibleIds });
    },

    clearShipmentSelection: () => set({ selectedShipmentIds: [] }),

    bulkSchedulePickup: async () => {
        const { selectedShipmentIds } = get();
        if (selectedShipmentIds.length === 0) return { success: false, error: 'No shipments selected' };

        try {
            const res = await fetch('/api/admin/shipments/bulk-pickup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipmentIds: selectedShipmentIds }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to schedule pickup');
            }

            const data = await res.json();
            set({ selectedShipmentIds: [] });
            // Refresh the shipments list
            get().fetchShipments();
            return { success: true, count: data.count };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    // ─── NDR Actions ─────────────────────────────────────────────────────────

    fetchNdrEvents: async () => {
        const { ndrFilters } = get();
        set({ ndrLoading: true });

        try {
            const params = new URLSearchParams({
                page: String(ndrFilters.page),
                pageSize: String(ndrFilters.pageSize),
                ...(ndrFilters.actionStatus !== 'all' && { actionStatus: ndrFilters.actionStatus }),
                ...(ndrFilters.search && { search: ndrFilters.search }),
            });

            const res = await fetch(`/api/admin/ndr?${params}`);

            if (!res.ok) {
                // Silently handle — user may not be authorized or no NDR table data
                set({ ndrEvents: [], ndrTotalCount: 0, ndrLoading: false });
                return;
            }

            const data = await res.json();
            set({
                ndrEvents: data.events || [],
                ndrTotalCount: data.totalCount || 0,
                ndrLoading: false,
            });
        } catch (err) {
            console.warn('[ShippingStore] fetchNdrEvents:', err);
            set({ ndrEvents: [], ndrTotalCount: 0, ndrLoading: false });
        }
    },

    setNdrFilter: (filters) => {
        set((state) => ({
            ndrFilters: { ...state.ndrFilters, ...filters },
        }));
        get().fetchNdrEvents();
    },

    resolveNdr: async (id, action, notes) => {
        try {
            const res = await fetch('/api/admin/ndr', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, actionTaken: action, adminNotes: notes }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to resolve NDR');
            }

            // Refresh NDR list
            get().fetchNdrEvents();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },
}));
