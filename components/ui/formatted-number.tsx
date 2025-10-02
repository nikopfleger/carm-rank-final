'use client';

import { useEffect, useState } from 'react';

type FormattedNumberProps = {
    value: number;
    options?: Intl.NumberFormatOptions;
    prefix?: string;
    suffix?: string;
};

export function FormattedNumber({ value, options, prefix = '', suffix = '' }: FormattedNumberProps) {
    const [text, setText] = useState<string>(() => `${prefix}${value}${suffix}`);

    useEffect(() => {
        try {
            const formatted = new Intl.NumberFormat(undefined, options).format(value);
            setText(`${prefix}${formatted}${suffix}`);
        } catch {
            setText(`${prefix}${value}${suffix}`);
        }
    }, [value, prefix, suffix, options]);

    return <>{text}</>;
}


