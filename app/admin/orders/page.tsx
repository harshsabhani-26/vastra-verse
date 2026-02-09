"use client";

import { useEffect, useState } from "react";
import OrdersListClient from "@/components/admin/OrdersListClient";
import { Button } from "@/components/ui/button";
import { Calendar, Filter } from "lucide-react";

interface OrdersPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
    });
    const [filters, setFilters] = useState({
        status: "all",
        dateRange: "30" // last 30 days by default
    });
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                status: filters.status,
            });

            // Add date range
            if (filters.dateRange !== "all") {
                const days = parseInt(filters.dateRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                params.append("startDate", startDate.toISOString());
            }

            const response = await fetch(`/api/admin/orders?${params}`);
            const data = await response.json();

            if (response.ok) {
                setOrders(data.orders);
                setPagination(data.pagination);
            } else {
                console.error("Failed to fetch orders:", data.error);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, filters.status, filters.dateRange]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleStatusChange = (status: string) => {
        setFilters(prev => ({ ...prev, status }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleDateRangeChange = (range: string) => {
        setFilters(prev => ({ ...prev, dateRange: range }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-[#1C1917]">Orders</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Manage and track all customer orders
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-stone-200">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Date Range Filter */}
                    <div className="flex-1">
                        <label className="text-xs text-stone-500 mb-1 block">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            Date Range
                        </label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                            className="w-full h-10 rounded-md border border-stone-200 px-3 text-sm"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex-1">
                        <label className="text-xs text-stone-500 mb-1 block">
                            <Filter className="inline h-3 w-3 mr-1" />
                            Order Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full h-10 rounded-md border border-stone-200 px-3 text-sm"
                        >
                            <option value="all">All Orders</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PACKED">Packed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="RETURNED">Returned</option>
                        </select>
                    </div>

                    {/* Results Count */}
                    <div className="flex-1 flex items-end">
                        <div className="text-sm text-stone-600">
                            {loading ? (
                                "Loading..."
                            ) : (
                                <>
                                    Showing {orders.length} of {pagination.total} orders
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <OrdersListClient
                initialOrders={orders}
                loading={loading}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-stone-200">
                    <p className="text-sm text-stone-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasMore || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
