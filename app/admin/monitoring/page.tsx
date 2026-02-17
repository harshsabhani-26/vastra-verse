'use client';

/**
 * Admin Monitoring Dashboard
 * 
 * Real-time observability dashboard with:
 * - System health overview
 * - Error rate chart
 * - Performance metrics
 * - Business metrics summary
 * - Active alerts
 * - Queue status
 * 
 * Auto-refreshes every 30 seconds.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Check,
    CheckCircle2,
    Clock,
    Database,
    Heart,
    Loader2,
    Mail,
    RefreshCcw,
    Server,
    ShieldAlert,
    TrendingUp,
    Truck,
    Wallet,
    XCircle,
    Zap,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    latencyMs: number;
    message?: string;
}

interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: string;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        email: ServiceHealth;
        payment: ServiceHealth;
        shipping: ServiceHealth;
    };
}

interface ErrorRate {
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
}

interface MonitoringData {
    health: SystemHealth | null;
    errors: {
        rate: ErrorRate | null;
        recent: { errors: any[]; total: number } | null;
        trends: Array<{ hour: string; count: number }> | null;
    };
    business: {
        orders: number;
        revenue: number;
        paymentSuccessRate: number;
        refunds: number;
        deliveries: number;
    } | null;
    performance: {
        api: { avg: number; p95: number; p99: number; count: number };
        database: { avg: number; p95: number; count: number };
        external: { avg: number; p95: number; count: number };
        webhook: { avg: number; p95: number; count: number };
    } | null;
    alerts: any[] | null;
    queues: Record<string, any> | null;
    timestamp: string;
}

// ============================================================
// Component
// ============================================================

export default function MonitoringDashboard() {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/monitoring/stats', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
            setError(null);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                <span className="ml-3 text-stone-500">Loading monitoring data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-amber-500" />
                        System Monitoring
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Real-time observability dashboard
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-stone-400">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {error}
                </div>
            )}

            {/* System Health Overview */}
            {data?.health && <SystemHealthCard health={data.health} />}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Error Rate */}
                <ErrorRateCard errorData={data?.errors} />

                {/* Performance Metrics */}
                <PerformanceCard performance={data?.performance ?? null} />

                {/* Business Metrics */}
                <BusinessMetricsCard business={data?.business ?? null} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Errors */}
                <RecentErrorsCard errors={data?.errors?.recent} />

                {/* Queue Status & Alerts */}
                <div className="space-y-6">
                    <QueueStatusCard queues={data?.queues} />
                    <RecentAlertsCard alerts={data?.alerts} />
                </div>
            </div>

            {/* Error Trends Chart */}
            {data?.errors?.trends && <ErrorTrendsChart trends={data.errors.trends} />}
        </div>
    );
}

// ============================================================
// Sub-Components
// ============================================================

function SystemHealthCard({ health }: { health: SystemHealth }) {
    const statusColors = {
        healthy: 'bg-emerald-500',
        degraded: 'bg-amber-500',
        unhealthy: 'bg-red-500',
        unknown: 'bg-stone-400',
    };

    const statusLabels = {
        healthy: 'All Systems Operational',
        degraded: 'Partial Degradation',
        unhealthy: 'System Issues Detected',
    };

    const services = [
        { key: 'database', label: 'Database', icon: Database },
        { key: 'redis', label: 'Redis', icon: Server },
        { key: 'email', label: 'Email', icon: Mail },
        { key: 'payment', label: 'Payment', icon: Wallet },
        { key: 'shipping', label: 'Shipping', icon: Truck },
    ] as const;

    const uptimeStr = formatUptime(health.uptime);

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {/* Health Banner */}
            <div className={`px-6 py-4 ${health.overall === 'healthy' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50' : health.overall === 'degraded' ? 'bg-gradient-to-r from-amber-50 to-amber-100/50' : 'bg-gradient-to-r from-red-50 to-red-100/50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[health.overall]} animate-pulse`} />
                        <div>
                            <h3 className="font-semibold text-stone-900">
                                {statusLabels[health.overall]}
                            </h3>
                            <p className="text-xs text-stone-500 mt-0.5">Uptime: {uptimeStr}</p>
                        </div>
                    </div>
                    <Heart className={`w-5 h-5 ${health.overall === 'healthy' ? 'text-emerald-500' : health.overall === 'degraded' ? 'text-amber-500' : 'text-red-500'}`} />
                </div>
            </div>

            {/* Service Grid */}
            <div className="px-6 py-4 grid grid-cols-5 gap-4">
                {services.map(({ key, label, icon: Icon }) => {
                    const svc = health.services[key];
                    return (
                        <div key={key} className="text-center">
                            <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${svc.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' :
                                svc.status === 'degraded' ? 'bg-amber-50 text-amber-600' :
                                    svc.status === 'unhealthy' ? 'bg-red-50 text-red-600' :
                                        'bg-stone-50 text-stone-400'
                                }`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-medium text-stone-700">{label}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                                {svc.latencyMs > 0 ? `${svc.latencyMs}ms` : svc.status}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ErrorRateCard({ errorData }: { errorData: MonitoringData['errors'] | undefined }) {
    const rate = errorData?.rate;
    if (!rate) return <EmptyCard title="Error Rate" icon={AlertTriangle} />;

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Error Rate
                </h3>
                <span className="text-xs text-stone-400">Last hour</span>
            </div>

            <div className="text-3xl font-bold text-stone-900 mb-3">{rate.total}</div>

            {/* By Severity */}
            <div className="space-y-2">
                {Object.entries(rate.bySeverity).map(([sev, count]) => (
                    <div key={sev} className="flex items-center justify-between text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${sev === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            sev === 'ERROR' ? 'bg-orange-100 text-orange-700' :
                                sev === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {sev}
                        </span>
                        <span className="font-mono text-stone-600">{count}</span>
                    </div>
                ))}
            </div>

            {/* By Source */}
            {Object.keys(rate.bySource).length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-100">
                    <p className="text-xs font-medium text-stone-500 mb-2">By Source</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(rate.bySource).map(([src, count]) => (
                            <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-600">
                                {src} <span className="font-mono font-bold">{count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PerformanceCard({ performance }: { performance: MonitoringData['performance'] }) {
    if (!performance) return <EmptyCard title="Performance" icon={Zap} />;

    const metrics = [
        { label: 'API', data: performance.api, color: 'text-blue-600 bg-blue-50' },
        { label: 'Database', data: performance.database, color: 'text-purple-600 bg-purple-50' },
        { label: 'External', data: performance.external, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Webhook', data: performance.webhook, color: 'text-amber-600 bg-amber-50' },
    ];

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Performance
                </h3>
                <span className="text-xs text-stone-400">Last hour</span>
            </div>

            <div className="space-y-3">
                {metrics.map(({ label, data, color }) => (
                    <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${color}`}>
                                {label[0]}
                            </span>
                            <span className="text-sm text-stone-700">{label}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-mono font-semibold text-stone-900">
                                {data.avg}ms
                            </span>
                            <span className="text-xs text-stone-400 ml-2">
                                p95: {data.p95}ms
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BusinessMetricsCard({ business }: { business: MonitoringData['business'] }) {
    if (!business) return <EmptyCard title="Business Metrics" icon={TrendingUp} />;

    const metrics = [
        { label: 'Orders Today', value: business.orders, icon: BarChart3, color: 'text-blue-600' },
        { label: 'Revenue', value: `₹${business.revenue.toLocaleString('en-IN')}`, icon: Wallet, color: 'text-emerald-600' },
        { label: 'Payment Success', value: `${business.paymentSuccessRate}%`, icon: CheckCircle2, color: business.paymentSuccessRate >= 95 ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Refunds', value: business.refunds, icon: ArrowDown, color: 'text-red-600' },
        { label: 'Deliveries', value: business.deliveries, icon: Truck, color: 'text-purple-600' },
    ];

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Business Metrics
                </h3>
                <span className="text-xs text-stone-400">Today</span>
            </div>

            <div className="space-y-3">
                {metrics.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className="text-sm text-stone-600">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-stone-900">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecentErrorsCard({ errors }: { errors: MonitoringData['errors']['recent'] | undefined }) {
    if (!errors?.errors?.length) {
        return (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    Recent Errors
                </h3>
                <div className="text-center py-8 text-stone-400 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    No unresolved errors
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    Recent Errors
                </h3>
                <span className="text-xs text-stone-400">{errors.total} total</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {errors.errors.map((err: any) => (
                    <div key={err.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 truncate">
                                    {err.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${err.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                        err.severity === 'ERROR' ? 'bg-orange-100 text-orange-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {err.severity}
                                    </span>
                                    <span className="text-[10px] text-stone-400">{err.source}</span>
                                    {err.endpoint && (
                                        <span className="text-[10px] text-stone-400 font-mono">{err.endpoint}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-mono text-stone-500">×{err.count}</span>
                                <p className="text-[10px] text-stone-400 mt-0.5">
                                    {new Date(err.lastSeen).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QueueStatusCard({ queues }: { queues: Record<string, any> | null | undefined }) {
    if (!queues || Object.keys(queues).length === 0) {
        return <EmptyCard title="Queue Status" icon={Activity} />;
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-blue-500" />
                Queue Status
            </h3>

            <div className="space-y-2">
                {Object.entries(queues).map(([name, stats]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                        <span className="text-sm font-medium text-stone-700 capitalize">{name}</span>
                        {stats.error ? (
                            <span className="text-xs text-red-500">Error</span>
                        ) : (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-stone-400">
                                    W:<span className="font-mono font-semibold text-stone-600">{stats.waiting}</span>
                                </span>
                                <span className="text-stone-400">
                                    A:<span className="font-mono font-semibold text-blue-600">{stats.active}</span>
                                </span>
                                <span className="text-stone-400">
                                    F:<span className={`font-mono font-semibold ${stats.failed > 0 ? 'text-red-600' : 'text-stone-600'}`}>{stats.failed}</span>
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecentAlertsCard({ alerts }: { alerts: any[] | null | undefined }) {
    if (!alerts?.length) {
        return (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Recent Alerts
                </h3>
                <div className="text-center py-4 text-stone-400 text-sm">
                    <Check className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                    No recent alerts
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Recent Alerts
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((alert: any) => (
                    <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg bg-stone-50">
                        {alert.resolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                            <XCircle className={`w-4 h-4 shrink-0 ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-stone-700 truncate">{alert.message}</p>
                            <p className="text-[10px] text-stone-400">
                                {alert.configuration?.name} · {new Date(alert.firedAt).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ErrorTrendsChart({ trends }: { trends: Array<{ hour: string; count: number }> }) {
    const maxCount = Math.max(...trends.map(t => t.count), 1);

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-stone-500" />
                Error Trends
                <span className="text-xs text-stone-400 font-normal">Last 24 hours</span>
            </h3>

            <div className="flex items-end gap-1 h-32">
                {trends.map((t, i) => {
                    const height = (t.count / maxCount) * 100;
                    const hourLabel = t.hour.split('T')[1]?.substring(0, 2) || '';
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-stone-400 font-mono">{t.count > 0 ? t.count : ''}</span>
                            <div
                                className={`w-full rounded-t transition-all ${t.count === 0 ? 'bg-stone-100' :
                                    t.count > maxCount * 0.8 ? 'bg-red-400' :
                                        t.count > maxCount * 0.5 ? 'bg-amber-400' :
                                            'bg-emerald-400'
                                    }`}
                                style={{ height: `${Math.max(height, 2)}%` }}
                            />
                            {i % 4 === 0 && (
                                <span className="text-[9px] text-stone-400">{hourLabel}h</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyCard({ title, icon: Icon }: { title: string; icon: any }) {
    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-stone-400" />
                {title}
            </h3>
            <div className="text-center py-6 text-stone-400 text-sm">
                <Clock className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                No data available yet
            </div>
        </div>
    );
}

// ============================================================
// Helpers
// ============================================================

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}
