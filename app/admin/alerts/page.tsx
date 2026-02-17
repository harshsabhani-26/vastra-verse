'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Bell,
    CheckCircle,
    ChevronDown,
    Info,
    Loader2,
    Package,
    RefreshCw,
    Shield,
    ShieldAlert,
    XCircle,
    Zap,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface SystemAlert {
    id: string;
    type: string;
    severity: string;
    message: string;
    details: any;
    isResolved: boolean;
    resolvedAt: string | null;
    resolvedBy: string | null;
    createdAt: string;
}

interface AlertSummary {
    critical: number;
    warning: number;
    info: number;
    totalActive: number;
}

// ============================================================
// Main Component
// ============================================================

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [summary, setSummary] = useState<AlertSummary | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [filter, setFilter] = useState<{
        resolved?: string;
        type?: string;
        severity?: string;
    }>({ resolved: 'false' });

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.resolved) params.set('resolved', filter.resolved);
            if (filter.type) params.set('type', filter.type);
            if (filter.severity) params.set('severity', filter.severity);
            params.set('limit', '50');

            const [alertsRes, summaryRes] = await Promise.all([
                fetch(`/api/admin/alerts?${params}`),
                fetch('/api/admin/alerts?action=summary'),
            ]);

            if (alertsRes.ok) {
                const data = await alertsRes.json();
                setAlerts(data.alerts || []);
                setTotal(data.total || 0);
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        fetchAlerts();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const runChecks = async () => {
        setChecking(true);
        try {
            await fetch('/api/admin/alerts?action=check');
            await fetchAlerts();
        } catch (error) {
            console.error('Failed to run checks:', error);
        }
        setChecking(false);
    };

    const resolveAlert = async (alertId: string) => {
        try {
            const res = await fetch('/api/admin/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId }),
            });
            if (res.ok) {
                await fetchAlerts();
            }
        } catch (error) {
            console.error('Failed to resolve alert:', error);
        }
    };

    const resolveAllOfType = async (type: string) => {
        try {
            const res = await fetch('/api/admin/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            if (res.ok) {
                await fetchAlerts();
            }
        } catch (error) {
            console.error('Failed to resolve alerts:', error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Alerts</h1>
                        <p className="text-sm text-gray-500">
                            Operational intelligence — auto-detected issues
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={runChecks}
                        disabled={checking}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                        {checking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                        Run Checks Now
                    </button>
                    <button
                        onClick={fetchAlerts}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <SummaryCard
                        label="Total Active"
                        count={summary.totalActive}
                        icon={Bell}
                        color="blue"
                    />
                    <SummaryCard
                        label="Critical"
                        count={summary.critical}
                        icon={XCircle}
                        color="red"
                    />
                    <SummaryCard
                        label="Warning"
                        count={summary.warning}
                        icon={AlertTriangle}
                        color="yellow"
                    />
                    <SummaryCard
                        label="Info"
                        count={summary.info}
                        icon={Info}
                        color="blue"
                    />
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <select
                    value={filter.resolved || ''}
                    onChange={(e) =>
                        setFilter((f) => ({
                            ...f,
                            resolved: e.target.value || undefined,
                        }))
                    }
                    className="text-sm border rounded-lg px-3 py-2 bg-white"
                >
                    <option value="false">Active</option>
                    <option value="true">Resolved</option>
                    <option value="">All</option>
                </select>
                <select
                    value={filter.severity || ''}
                    onChange={(e) =>
                        setFilter((f) => ({
                            ...f,
                            severity: e.target.value || undefined,
                        }))
                    }
                    className="text-sm border rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                </select>
                <select
                    value={filter.type || ''}
                    onChange={(e) =>
                        setFilter((f) => ({
                            ...f,
                            type: e.target.value || undefined,
                        }))
                    }
                    className="text-sm border rounded-lg px-3 py-2 bg-white"
                >
                    <option value="">All Types</option>
                    <option value="PAYMENT_FAILURE">Payment Failure</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="ORDER_DROP">Order Drop</option>
                    <option value="WEBHOOK_FAILURE">Webhook Failure</option>
                    <option value="ERROR_SPIKE">Error Spike</option>
                    <option value="GATEWAY_DOWN">Gateway Down</option>
                </select>
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700">All Clear</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        No active alerts. System is healthy.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-gray-500">{total} total alerts</p>
                    {alerts.map((alert) => (
                        <AlertRow
                            key={alert.id}
                            alert={alert}
                            onResolve={resolveAlert}
                            onResolveAll={resolveAllOfType}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Sub-Components
// ============================================================

function SummaryCard({
    label,
    count,
    icon: Icon,
    color,
}: {
    label: string;
    count: number;
    icon: any;
    color: string;
}) {
    const colors: Record<string, string> = {
        red: 'bg-red-50 text-red-700 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color] || colors.blue}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-2xl font-bold">{count}</div>
        </div>
    );
}

function AlertRow({
    alert,
    onResolve,
    onResolveAll,
}: {
    alert: SystemAlert;
    onResolve: (id: string) => void;
    onResolveAll: (type: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const severityConfig: Record<string, { bg: string; icon: any; text: string }> = {
        CRITICAL: { bg: 'bg-red-50 border-red-200', icon: XCircle, text: 'text-red-700' },
        WARNING: { bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle, text: 'text-yellow-700' },
        INFO: { bg: 'bg-blue-50 border-blue-200', icon: Info, text: 'text-blue-700' },
    };

    const typeIcons: Record<string, any> = {
        PAYMENT_FAILURE: AlertCircle,
        LOW_STOCK: Package,
        ORDER_DROP: AlertTriangle,
        WEBHOOK_FAILURE: Zap,
        ERROR_SPIKE: ShieldAlert,
        GATEWAY_DOWN: Shield,
    };

    const config = severityConfig[alert.severity] || severityConfig.INFO;
    const SeverityIcon = config.icon;
    const TypeIcon = typeIcons[alert.type] || AlertCircle;

    return (
        <div className={`rounded-xl border ${alert.isResolved ? 'bg-gray-50 border-gray-200 opacity-60' : config.bg}`}>
            <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <SeverityIcon className={`w-5 h-5 ${config.text}`} />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                    alert.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {alert.severity}
                            </span>
                            <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                                {alert.type.replace(/_/g, ' ')}
                            </span>
                            {alert.isResolved && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Resolved
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(alert.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!alert.isResolved && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onResolve(alert.id);
                            }}
                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Resolve
                        </button>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </div>

            {expanded && alert.details && (
                <div className="px-4 pb-4 border-t border-gray-200/50 pt-3">
                    <pre className="text-xs bg-white/80 rounded-lg p-3 overflow-auto max-h-48 text-gray-700">
                        {JSON.stringify(alert.details, null, 2)}
                    </pre>
                    {!alert.isResolved && (
                        <button
                            onClick={() => onResolveAll(alert.type)}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            Resolve all {alert.type.replace(/_/g, ' ').toLowerCase()} alerts
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
