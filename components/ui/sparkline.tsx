'use client';

import { cn } from '@/lib/utils';

interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    className?: string;
}

export function Sparkline({
    data,
    color = '#8b5cf6',
    width = 60,
    height = 20,
    className
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const pathData = `M ${points}`;

    return (
        <div className={cn('inline-block', className)}>
            <svg width={width} height={height} className="overflow-visible">
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-70"
                />
            </svg>
        </div>
    );
}
