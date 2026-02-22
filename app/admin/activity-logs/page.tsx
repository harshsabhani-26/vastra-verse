'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityLogsPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });

    const [filters, setFilters] = useState({
        action: '',
        status: '',
        startDate: '',
        endDate: '',
        search: '',
    });

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.action && { action: filters.action }),
                ...(filters.status && { status: filters.status }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
            });

            const response = await fetch(`/api/admin/activity-logs?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
            SUCCESS: 'default',
            FAILED: 'destructive',
            WARNING: 'secondary',
        };
        return (
            <Badge variant={variants[status] || 'default'}>
                {status}
            </Badge>
        );
    };

    const getActionColor = (action: string) => {
        if (action.startsWith('DELETE') || action.includes('DISABLE')) return 'text-red-600';
        if (action.startsWith('CREATE') || action.startsWith('ENABLE')) return 'text-green-600';
        if (action.startsWith('UPDATE')) return 'text-blue-600';
        return 'text-gray-600';
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Activity Logs</h1>
                <p className="text-sm text-stone-500 mt-1">
                    Monitor system activity and administrative actions
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Select value={filters.action || "ALL"} onValueChange={(value) => setFilters({ ...filters, action: value === "ALL" ? "" : value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="LOGIN">Login</SelectItem>
                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                    <SelectItem value="UPDATE_STORE_SETTINGS">Update Store</SelectItem>
                                    <SelectItem value="UPDATE_TAX_SETTINGS">Update Tax</SelectItem>
                                    <SelectItem value="TOGGLE_MAINTENANCE_MODE">Maintenance Toggle</SelectItem>
                                    <SelectItem value="ENABLE_2FA">Enable 2FA</SelectItem>
                                    <SelectItem value="DISABLE_2FA">Disable 2FA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={filters.status || "ALL"} onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? "" : value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="SUCCESS">Success</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="WARNING">Warning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                placeholder="Start Date"
                            />
                        </div>

                        <div>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                placeholder="End Date"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ action: '', status: '', startDate: '', endDate: '', search: '' })}
                        >
                            Clear Filters
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Activity History</CardTitle>
                            <CardDescription>
                                Showing {logs.length} of {pagination.total} total logs
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No activity logs found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-stone-50 border-b border-stone-200">
                                        <tr>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">Date/Time</th>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">User</th>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">Action</th>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">Description</th>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">Status</th>
                                            <th className="p-3 text-left text-sm font-medium text-stone-600">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-stone-50">
                                                <td className="p-3 text-sm text-stone-600 whitespace-nowrap">
                                                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <div>
                                                        <div className="font-medium text-stone-800">{log.user?.name || 'System'}</div>
                                                        <div className="text-stone-500 text-xs">{log.userEmail}</div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <span className={`font-medium ${getActionColor(log.action)}`}>
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-stone-700">
                                                    {log.description}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {getStatusBadge(log.status)}
                                                </td>
                                                <td className="p-3 text-sm text-stone-500">
                                                    {log.ipAddress || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-stone-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
