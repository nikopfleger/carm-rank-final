'use client';

import { useState } from 'react';

interface SimpleTooltipProps {
    children: React.ReactNode;
    text: string;
}

export function SimpleTooltip({ children, text }: SimpleTooltipProps) {
    const [show, setShow] = useState(false);

    return (
        <div
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        zIndex: 99999,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        border: 'none',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    {text}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #000000'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
