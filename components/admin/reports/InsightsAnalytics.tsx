"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle, Package, Users } from "lucide-react";
import toast from "react-hot-toast";

interface Insight {
    id: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    category: 'revenue' | 'inventory' | 'customer' | 'product' | 'seasonal';
    title: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    metrics?: Record<string, number | string>;
}

interface InsightsReport {
    insights: Insight[];
    generatedAt: string;
    totalInsights: number;
    byPriority: {
        high: number;
        medium: number;
        low: number;
    };
    byCategory: {
        revenue: number;
        inventory: number;
        customer: number;
        product: number;
        seasonal: number;
    };
}

export default function InsightsAnalytics() {
    const [data, setData] = useState<InsightsReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/reports/insights');
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                toast.error(result.error || "Failed to fetch insights");
            }
        } catch (error) {
            console.error("Error fetching insights:", error);
            toast.error("Failed to fetch insights");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="text-center py-12 text-stone-500">Generating AI insights...</div>;
    if (!data) return <div className="text-center py-12 text-stone-500">No insights available</div>;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'danger': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            default: return <BrainCircuit className="w-5 h-5 text-stone-500" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'revenue': return <TrendingUp className="w-4 h-4 mr-1" />;
            case 'inventory': return <Package className="w-4 h-4 mr-1" />;
            case 'customer': return <Users className="w-4 h-4 mr-1" />;
            case 'product': return <Package className="w-4 h-4 mr-1" />;
            default: return null;
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'success': return "border-l-4 border-l-green-500 bg-green-50/50";
            case 'warning': return "border-l-4 border-l-amber-500 bg-amber-50/50";
            case 'danger': return "border-l-4 border-l-red-500 bg-red-50/50";
            case 'info': return "border-l-4 border-l-blue-500 bg-blue-50/50";
            default: return "border-l-4 border-l-stone-300";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                        AI Strategic Insights
                    </h3>
                    <p className="text-sm text-stone-500">Automated analysis and recommendations</p>
                </div>
                <Button onClick={() => fetchData()} variant="outline" size="sm">
                    Refresh Analysis
                </Button>
            </div>

            {/* Priority Summary */}
            <div className="flex gap-4 mb-4">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    High Priority: {data.byPriority.high}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Medium Priority: {data.byPriority.medium}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Low Priority: {data.byPriority.low}
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {data.insights.map((insight) => (
                    <Card key={insight.id} className={`${getTypeStyles(insight.type)} shadow-sm`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    {getIcon(insight.type)}
                                    <div>
                                        <CardTitle className="text-base font-semibold text-stone-900">
                                            {insight.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {getCategoryIcon(insight.category)}
                                                {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                                            </Badge>
                                            <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                                                {insight.priority} Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-stone-700 mb-3 text-sm leading-relaxed">
                                {insight.description}
                            </p>
                            <div className="bg-white/80 p-3 rounded-md border border-stone-100">
                                <span className="font-semibold text-xs text-stone-900 block mb-1">Recommendation:</span>
                                <p className="text-sm text-stone-600 italic">
                                    "{insight.recommendation}"
                                </p>
                            </div>
                            {insight.metrics && (
                                <div className="mt-3 flex gap-4 text-xs text-stone-500">
                                    {Object.entries(insight.metrics).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="font-medium mr-1">{key}:</span>
                                            {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {data.insights.length === 0 && (
                    <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-lg">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium text-stone-900">All Systems Normal</h3>
                        <p className="mt-2">No critical insights or anomalies detected at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
