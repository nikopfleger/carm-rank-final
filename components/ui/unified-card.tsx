import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { unifiedStyles } from "./unified-styles";

export type UnifiedCardVariant = 'default' | 'elevated' | 'flat' | 'bordered' | 'gradient';

export interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: UnifiedCardVariant;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface UnifiedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon;
    iconColor?: string;
    actions?: React.ReactNode;
}

const cardVariantStyles: Record<UnifiedCardVariant, string> = {
    default: "bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700",
    elevated: unifiedStyles.card,
    flat: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
    bordered: "bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600",
    gradient: "bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
};

const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
};

export const UnifiedCard = React.forwardRef<HTMLDivElement, UnifiedCardProps>(
    ({ variant = 'default', hover = false, padding, className, children, ...props }, ref) => {
        return (
            <Card
                ref={ref}
                className={cn(
                    cardVariantStyles[variant],
                    hover && "hover:shadow-lg hover:scale-[1.01] transition-all duration-200",
                    padding && paddingStyles[padding],
                    className
                )}
                {...props}
            >
                {children}
            </Card>
        );
    }
);

UnifiedCard.displayName = "UnifiedCard";

export const UnifiedCardHeader = React.forwardRef<HTMLDivElement, UnifiedCardHeaderProps>(
    ({ icon: Icon, iconColor, actions, children, className, ...props }, ref) => {
        return (
            <CardHeader ref={ref} className={cn("flex flex-row items-center justify-between space-y-0 pb-3", className)} {...props}>
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn("p-2 rounded-lg", iconColor || "bg-blue-100 dark:bg-blue-900/20")}>
                            <Icon className={cn("w-5 h-5", iconColor ? "text-current" : "text-blue-600 dark:text-blue-400")} />
                        </div>
                    )}
                    <div>
                        {children}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </CardHeader>
        );
    }
);

UnifiedCardHeader.displayName = "UnifiedCardHeader";

export const UnifiedCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => {
        return (
            <CardTitle
                ref={ref}
                className={cn("text-lg font-semibold text-gray-900 dark:text-gray-100", className)}
                {...props}
            />
        );
    }
);

UnifiedCardTitle.displayName = "UnifiedCardTitle";

export const UnifiedCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => {
        return (
            <CardDescription
                ref={ref}
                className={cn("text-sm text-gray-600 dark:text-gray-400 mt-1", className)}
                {...props}
            />
        );
    }
);

UnifiedCardDescription.displayName = "UnifiedCardDescription";

export const UnifiedCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <CardContent
                ref={ref}
                className={cn("pt-0", className)}
                {...props}
            />
        );
    }
);

UnifiedCardContent.displayName = "UnifiedCardContent";

export const UnifiedCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <CardFooter
                ref={ref}
                className={cn("pt-3 border-t border-gray-200 dark:border-gray-700", className)}
                {...props}
            />
        );
    }
);

UnifiedCardFooter.displayName = "UnifiedCardFooter";
