import React from 'react';

type SeparatorServerProps = {
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    style?: React.CSSProperties;
};

export function SeparatorServer({ orientation = 'horizontal', className, style }: SeparatorServerProps) {
    const base = orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full';
    return <div className={["shrink-0 bg-gray-200 dark:bg-gray-800", base, className].filter(Boolean).join(' ')} style={style} />;
}


