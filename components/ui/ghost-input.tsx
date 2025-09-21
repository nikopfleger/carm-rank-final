import { cn } from "@/lib/utils";
import React from "react";

type GhostInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const GhostInput = React.forwardRef<HTMLInputElement, GhostInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                {...props}
                className={cn(
                    // sin marco/box
                    "w-full bg-transparent border-none shadow-none outline-none",
                    // sin ring de shadcn
                    "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    // tipografía centrada (opcional)
                    "text-center",
                    // altura compacta
                    "h-7 leading-7",
                    // quitar spinners en number
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    className
                )}
            />
        );
    }
);

GhostInput.displayName = "GhostInput";
