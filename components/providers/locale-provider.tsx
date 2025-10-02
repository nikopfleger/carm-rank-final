'use client';

import { LocaleContext } from '@/app/LocaleContext';
import { ReactNode } from 'react';

export default function LocaleProvider({ locale, children }: { locale: string; children: ReactNode }) {
    return (
        <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
    );
}


