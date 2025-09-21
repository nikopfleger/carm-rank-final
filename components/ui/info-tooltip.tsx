'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';

interface InfoTooltipProps {
    children: ReactNode;
    content: string;
    className?: string;
}

export function InfoTooltip({ children, content, className }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={cn('relative inline-block', className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    {content}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                </div>
            )}
        </div>
    );
}
