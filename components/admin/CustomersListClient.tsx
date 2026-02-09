'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Search,
    Star,
    Ban,
    Download,
    Mail,
    Filter,
    X,
} from 'lucide-react';
import { toggleVIP } from '@/app/admin/customers/actions';
import { toast } from 'react-hot-toast';
import ExportDialog from './ExportDialog';
import BulkMessageDialog from './BulkMessageDialog';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    phoneVerified: boolean;
    isVIP: boolean;
    isBlocked: boolean;
    blockedReason: string | null;
    blockedAt: Date | null;
    createdAt: Date;
    orderCount: number;
    totalSpent: number;
    lastOrder: string | null;
    addressCount: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CustomersListClient({
    customers: initialCustomers,
    pagination,
}: {
    customers: Customer[];
    pagination: Pagination;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState('');
    const [vipOnly, setVipOnly] = useState(false);
    const [blockedOnly, setBlockedOnly] = useState(false);
    const [minOrders, setMinOrders] = useState('');
    const [minSpent, setMinSpent] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showMessageDialog, setShowMessageDialog] = useState(false);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (vipOnly) params.set('vipOnly', 'true');
        if (blockedOnly) params.set('blockedOnly', 'true');
        if (minOrders) params.set('minOrders', minOrders);
        if (minSpent) params.set('minSpent', minSpent);

        router.push(`/admin/customers?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearch('');
        setVipOnly(false);
        setBlockedOnly(false);
        setMinOrders('');
        setMinSpent('');
        router.push('/admin/customers');
    };

    const handleToggleVIP = async (
        e: React.MouseEvent,
        customerId: string,
        currentVIP: boolean
    ) => {
        e.stopPropagation();
        startTransition(async () => {
            const result = await toggleVIP(customerId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Customer ${result.isVIP ? 'marked as' : 'removed from'} VIP`);
                router.refresh();
            }
        });
    };

    const handleRowClick = (customerId: string) => {
        router.push(`/admin/customers/${customerId}`);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCustomers(initialCustomers.map((c) => c.id));
        } else {
            setSelectedCustomers([]);
        }
    };

    const handleSelectCustomer = (customerId: string, checked: boolean) => {
        if (checked) {
            setSelectedCustomers([...selectedCustomers, customerId]);
        } else {
            setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex gap-4 items-start">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <Button onClick={handleSearch} className="bg-emerald-700 hover:bg-emerald-800">
                        Search
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                    {(search || vipOnly || blockedOnly || minOrders || minSpent) && (
                        <Button variant="ghost" onClick={clearFilters} className="gap-2">
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Bulk Actions */}
                {selectedCustomers.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportDialog(true)}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export ({selectedCustomers.length})
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowMessageDialog(true)}
                            className="gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            Message ({selectedCustomers.length})
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 grid grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={vipOnly}
                            onChange={(e) => setVipOnly(e.target.checked)}
                            className="rounded"
                        />
                        <span>VIP Only</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={blockedOnly}
                            onChange={(e) => setBlockedOnly(e.target.checked)}
                            className="rounded"
                        />
                        <span>Blocked Only</span>
                    </label>
                    <div>
                        <label className="text-sm text-stone-600">Min Orders</label>
                        <input
                            type="number"
                            value={minOrders}
                            onChange={(e) => setMinOrders(e.target.value)}
                            placeholder="0"
                            className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-stone-600">Min Spent (₹)</label>
                        <input
                            type="number"
                            value={minSpent}
                            onChange={(e) => setMinSpent(e.target.value)}
                            placeholder="0"
                            className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Customers Table */}
            <div className="bg-white rounded-lg border border-stone-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedCustomers.length === initialCustomers.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="rounded"
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Last Order</TableHead>
                            <TableHead>VIP</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-stone-500 py-8">
                                    No customers found
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialCustomers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    onClick={() => handleRowClick(customer.id)}
                                    className="cursor-pointer hover:bg-stone-50"
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.includes(customer.id)}
                                            onChange={(e) =>
                                                handleSelectCustomer(customer.id, e.target.checked)
                                            }
                                            className="rounded"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-[#1C1917]">
                                        {customer.name}
                                    </TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>
                                        {customer.phone}
                                        {customer.phoneVerified && (
                                            <span className="ml-2 text-xs text-emerald-600">✓</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{customer.orderCount}</TableCell>
                                    <TableCell>₹{customer.totalSpent.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {customer.lastOrder
                                            ? new Date(customer.lastOrder).toLocaleDateString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleToggleVIP(e, customer.id, customer.isVIP)}
                                            disabled={isPending}
                                            className={`p-1 rounded ${customer.isVIP
                                                ? 'text-yellow-500 hover:text-yellow-600'
                                                : 'text-stone-300 hover:text-stone-400'
                                                }`}
                                        >
                                            <Star className={`h-5 w-5 ${customer.isVIP ? 'fill-yellow-500' : ''}`} />
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        {customer.isBlocked ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                                                <Ban className="h-3 w-3" />
                                                Blocked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                                                Active
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-stone-200">
                    <p className="text-sm text-stone-600">
                        Page {pagination.page} of {pagination.totalPages} • {pagination.total} total customers
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (pagination.page - 1).toString());
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', (pagination.page + 1).toString());
                                router.push(`?${params.toString()}`);
                            }}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {showExportDialog && (
                <ExportDialog
                    customerIds={selectedCustomers}
                    onClose={() => setShowExportDialog(false)}
                />
            )}
            {showMessageDialog && (
                <BulkMessageDialog
                    customerIds={selectedCustomers}
                    onClose={() => setShowMessageDialog(false)}
                />
            )}
        </div>
    );
}
