import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { unifiedStyles } from "./unified-styles";

export type UnifiedButtonVariant =
    | 'primary'
    | 'secondary'
    | 'small'
    | 'approve'
    | 'reject'
    | 'cancel'
    | 'save'
    | 'edit'
    | 'delete'
    | 'outline'
    | 'ghost';

export interface UnifiedButtonProps extends Omit<ButtonProps, 'variant'> {
    variant?: UnifiedButtonVariant;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

const variantStyles: Record<UnifiedButtonVariant, string> = {
    primary: unifiedStyles.primaryButton,
    secondary: unifiedStyles.secondaryButton,
    small: unifiedStyles.smallButton,
    approve: "h-10 px-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",
    reject: "h-10 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",
    cancel: "h-10 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 transition-all duration-200 font-medium",
    save: "h-10 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",
    edit: "h-10 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",
    delete: "h-10 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium",
    outline: "h-10 px-4 rounded-xl bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 font-medium",
    ghost: "h-10 px-4 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 font-medium"
};

export const UnifiedButton = React.forwardRef<HTMLButtonElement, UnifiedButtonProps>(
    ({
        variant = 'primary',
        icon: Icon,
        iconPosition = 'left',
        loading = false,
        fullWidth = false,
        children,
        className,
        disabled,
        ...props
    }, ref) => {
        const isDisabled = disabled || loading;

        return (
            <Button
                ref={ref}
                className={cn(
                    variantStyles[variant],
                    fullWidth && "w-full",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                disabled={isDisabled}
                {...props}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {children}
                    </>
                ) : (
                    <>
                        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
                        {children}
                        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
                    </>
                )}
            </Button>
        );
    }
);

UnifiedButton.displayName = "UnifiedButton";
