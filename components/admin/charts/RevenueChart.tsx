'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface RevenueChartProps {
    data: Array<{
        date: string;
        revenue: number;
        orders?: number;
    }>;
    comparisonData?: Array<{
        date: string;
        revenue: number;
    }>;
    showComparison?: boolean;
    type?: 'line' | 'area';
}

export default function RevenueChart({
    data,
    comparisonData,
    showComparison = false,
    type = 'area',
}: RevenueChartProps) {
    const Chart = type === 'area' ? AreaChart : LineChart;
    const DataComponent = type === 'area' ? Area : Line;

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <Chart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend />
                    {type === 'area' ? (
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                    ) : (
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                    {showComparison && comparisonData && (
                        <Line
                            type="monotone"
                            dataKey="comparisonRevenue"
                            stroke="#6b7280"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#6b7280', r: 4 }}
                        />
                    )}
                </Chart>
            </ResponsiveContainer>
        </div>
    );
}
