"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const FloatingNav = dynamic(() => import('@/components/floating-nav').then(m => m.FloatingNav), { ssr: false });

interface ClientShellProps {
    children: React.ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
    return (
        <>
            <FloatingNav />
            {children}
        </>
    );
}


