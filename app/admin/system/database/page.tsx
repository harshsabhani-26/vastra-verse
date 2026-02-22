"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    RefreshCw,
    Play,
    CheckCircle,
    XCircle,
    Clock,
    Server,
    AlertTriangle,
    Loader2,
    Shield,
} from "lucide-react";
import toast from "react-hot-toast";

interface HealthData {
    status: string;
    environment: string;
    timestamp: string;
    database: {
        connectionStatus: string;
        connectionTimeMs: number;
        migrationStatus: string;
        appliedMigrations: number;
        pendingMigrations: string[];
        lastMigration: string | null;
    };
    seed: {
        version: string | null;
        lastExecution: string | null;
    };
    configTables: Record<string, number>;
}

interface SeedResult {
    success: boolean;
    environment: string;
    duration: number;
    results: { name: string; status: string; error?: string }[];
}

export default function DatabasePage() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [seedResults, setSeedResults] = useState<SeedResult | null>(null);
    const [migrationLogs, setMigrationLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        fetchHealth();
    }, []);

    async function fetchHealth() {
        try {
            setLoading(true);
            const response = await fetch("/api/system/db-health");
            if (response.ok) {
                const data = await response.json();
                setHealth(data);
            } else {
                toast.error("Failed to fetch health status");
            }
        } catch (error) {
            toast.error("Failed to connect to health endpoint");
        } finally {
            setLoading(false);
        }
    }

    async function runSeed(confirmed = false) {
        try {
            setSeeding(true);
            setSeedResults(null);

            const response = await fetch("/api/system/db-seed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmed }),
            });

            const data = await response.json();

            if (data.requiresConfirmation) {
                setShowConfirmation(true);
                setSeeding(false);
                return;
            }

            if (response.ok) {
                setSeedResults(data);
                toast.success(
                    data.success ? "Seeding completed successfully!" : "Seeding completed with errors"
                );
                fetchHealth(); // Refresh health data
            } else {
                toast.error(data.error || "Seeding failed");
            }
        } catch (error) {
            toast.error("Failed to run seed");
        } finally {
            setSeeding(false);
            setShowConfirmation(false);
        }
    }

    const envColor = {
        production: "bg-red-100 text-red-800 border-red-200",
        staging: "bg-amber-100 text-amber-800 border-amber-200",
        development: "bg-green-100 text-green-800 border-green-200",
    };

    const statusIcon = {
        connected: <CheckCircle className="w-5 h-5 text-green-600" />,
        disconnected: <XCircle className="w-5 h-5 text-red-600" />,
        error: <XCircle className="w-5 h-5 text-red-600" />,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Database Management</h2>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Database Management</h2>
                    <p className="text-sm text-stone-500 mt-1">
                        Monitor migrations, seeds, and database health
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {health && (
                        <Badge
                            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${envColor[health.environment as keyof typeof envColor] || envColor.development
                                }`}
                        >
                            {health.environment}
                        </Badge>
                    )}
                    <Button variant="outline" onClick={fetchHealth} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {health && (
                <>
                    {/* Status Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Connection Status */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-3">
                                    {statusIcon[health.database.connectionStatus as keyof typeof statusIcon]}
                                    <span className="text-sm font-medium text-stone-700">Connection</span>
                                </div>
                                <p className="text-2xl font-bold text-[#1C1917] capitalize">
                                    {health.database.connectionStatus}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    {health.database.connectionTimeMs}ms response time
                                </p>
                            </CardContent>
                        </Card>

                        {/* Migration Status */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Database className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-stone-700">Migrations</span>
                                </div>
                                <p className="text-2xl font-bold text-[#1C1917]">
                                    {health.database.appliedMigrations}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    {health.database.migrationStatus === "up-to-date"
                                        ? "✓ All up to date"
                                        : `⚠ ${health.database.pendingMigrations.length} pending`}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Seed Version */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Play className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-stone-700">Seed Version</span>
                                </div>
                                <p className="text-2xl font-bold text-[#1C1917]">
                                    {health.seed.version || "Not run"}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    {health.seed.lastExecution
                                        ? `Last: ${new Date(health.seed.lastExecution).toLocaleDateString()}`
                                        : "Never executed"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Environment */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Server className="w-5 h-5 text-violet-600" />
                                    <span className="text-sm font-medium text-stone-700">Environment</span>
                                </div>
                                <p className="text-2xl font-bold text-[#1C1917] capitalize">
                                    {health.environment}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    {new Date(health.timestamp).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Config Tables Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="w-5 h-5" />
                                Configuration Tables
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(health.configTables).map(([table, count]) => (
                                    <div
                                        key={table}
                                        className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                                    >
                                        <span className="text-sm font-medium text-stone-700 capitalize">
                                            {table.replace(/([A-Z])/g, " $1").trim()}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={count > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                                        >
                                            {count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Play className="w-5 h-5" />
                                Database Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Confirmation Dialog */}
                            {showConfirmation && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-red-900">Production Confirmation Required</h4>
                                            <p className="text-sm text-red-700 mt-1">
                                                You are about to run database seeds in <strong>PRODUCTION</strong>.
                                                This will upsert configuration data. Ensure you have a backup.
                                            </p>
                                            <div className="flex gap-3 mt-4">
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => runSeed(true)}
                                                    disabled={seeding}
                                                >
                                                    {seeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                    Yes, Run Seeds
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowConfirmation(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => runSeed()}
                                    disabled={seeding}
                                    className="bg-[#1C1917] text-white hover:bg-stone-800"
                                >
                                    {seeding ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4 mr-2" />
                                    )}
                                    Run Seed
                                </Button>

                                <Button variant="outline" onClick={fetchHealth} disabled={loading}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Check Health
                                </Button>
                            </div>

                            {/* Seed Results */}
                            {seedResults && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-bold text-stone-700 mb-2">Seed Results</h4>
                                    <div className="space-y-2">
                                        {seedResults.results.map((result, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between p-3 rounded-lg ${result.status === "success"
                                                        ? "bg-green-50 border border-green-200"
                                                        : "bg-red-50 border border-red-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {result.status === "success" ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className="text-sm font-medium">{result.name}</span>
                                                </div>
                                                {result.error && (
                                                    <span className="text-xs text-red-600">{result.error}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-stone-500 mt-2">
                                        Duration: {seedResults.duration}ms
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Migrations Warning */}
                    {health.database.pendingMigrations.length > 0 && (
                        <Card className="border-amber-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-amber-900">Pending Migrations</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            The following migrations have not been applied:
                                        </p>
                                        <ul className="list-disc list-inside mt-2 text-sm text-amber-800">
                                            {health.database.pendingMigrations.map((m, i) => (
                                                <li key={i} className="font-mono text-xs">{m}</li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-amber-600 mt-3">
                                            Run <code className="bg-amber-100 px-1 rounded">npx prisma migrate deploy</code> to apply.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
