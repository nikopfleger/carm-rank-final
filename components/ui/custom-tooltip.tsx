'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CustomTooltipProps {
    children: React.ReactNode;
    content: string;
    className?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export function CustomTooltip({
    children,
    content,
    className,
    position = 'top'
}: CustomTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            case 'bottom':
                return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
            default:
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case 'top':
                return 'top-full left-1/2 transform -translate-x-1/2';
            case 'bottom':
                return 'bottom-full left-1/2 transform -translate-x-1/2';
            case 'left':
                return 'left-full top-1/2 transform -translate-y-1/2';
            case 'right':
                return 'right-full top-1/2 transform -translate-y-1/2';
            default:
                return 'top-full left-1/2 transform -translate-x-1/2';
        }
    };

    const getArrowStyle = () => {
        switch (position) {
            case 'top':
                return {
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent !important',
                    borderRight: '4px solid transparent !important',
                    borderTop: '4px solid black !important'
                };
            case 'bottom':
                return {
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent !important',
                    borderRight: '4px solid transparent !important',
                    borderBottom: '4px solid black !important'
                };
            case 'left':
                return {
                    width: 0,
                    height: 0,
                    borderTop: '4px solid transparent !important',
                    borderBottom: '4px solid transparent !important',
                    borderLeft: '4px solid black !important'
                };
            case 'right':
                return {
                    width: 0,
                    height: 0,
                    borderTop: '4px solid transparent !important',
                    borderBottom: '4px solid transparent !important',
                    borderRight: '4px solid black !important'
                };
            default:
                return {
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent !important',
                    borderRight: '4px solid transparent !important',
                    borderTop: '4px solid black !important'
                };
        }
    };

    return (
        <div
            className={cn('relative inline-block', className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50">
                    <div
                        className={cn(
                            'px-3 py-2 text-sm rounded-lg shadow-lg whitespace-nowrap',
                            getPositionClasses()
                        )}
                        style={{
                            color: 'white !important',
                            backgroundColor: 'black !important',
                            zIndex: 9999
                        }}
                    >
                        {content}
                        <div
                            className={cn('absolute', getArrowClasses())}
                            style={getArrowStyle()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
