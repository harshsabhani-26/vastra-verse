'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
    value: number;
    suffix?: string;
    showPercentage?: boolean;
}

export default function TrendIndicator({
    value,
    suffix = '%',
    showPercentage = true,
}: TrendIndicatorProps) {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    const color = isNeutral
        ? 'text-gray-500'
        : isPositive
            ? 'text-green-600'
            : 'text-red-600';

    const bgColor = isNeutral
        ? 'bg-gray-100'
        : isPositive
            ? 'bg-green-50'
            : 'bg-red-50';

    const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${bgColor}`}>
            <Icon className={`w-4 h-4 ${color}`} />
            <span className={`text-sm font-medium ${color}`}>
                {showPercentage && !isNeutral && (isPositive ? '+' : '')}
                {Math.abs(value).toFixed(1)}
                {suffix}
            </span>
        </div>
    );
}
