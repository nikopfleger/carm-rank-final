'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

/** Pequeño helper para concatenar clases sin depender de "@/lib/utils" */
function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type ContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    className?: string;
};

const Content = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    ContentProps
>(({ className, sideOffset = 6, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            // contenedor
            'z-50 overflow-hidden rounded-md border shadow-md',
            // tokens shadcn (si los tenés en tu theme)
            'bg-popover text-popover-foreground',
            // fallback razonable si no usás esos tokens
            'bg-neutral-800 text-white border-neutral-700',
            // animaciones tailwind (opcionales)
            'animate-in fade-in-0 zoom-in-95 px-3 py-2 text-sm',
            className
        )}
        {...props}
    />
));
Content.displayName = TooltipPrimitive.Content.displayName;

export const TooltipContent = Content;
