import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";
import { unifiedStyles } from "./unified-styles";

export interface UnifiedInputProps extends InputProps {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export interface UnifiedSelectProps {
    label?: string;
    error?: string;
    helperText?: string;
    placeholder?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    options: { value: string; label: string; disabled?: boolean }[];
    fullWidth?: boolean;
    className?: string;
}

export const UnifiedInput = React.forwardRef<HTMLInputElement, UnifiedInputProps>(
    ({
        label,
        error,
        helperText,
        icon: Icon,
        iconPosition = 'left',
        fullWidth = false,
        className,
        ...props
    }, ref) => {
        const inputId = React.useId();

        return (
            <div className={cn("space-y-2", fullWidth && "w-full")}>
                {label && (
                    <Label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </Label>
                )}

                <div className="relative">
                    {Icon && iconPosition === 'left' && (
                        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}

                    <Input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            unifiedStyles.input,
                            Icon && iconPosition === 'left' && "pl-10",
                            Icon && iconPosition === 'right' && "pr-10",
                            error && "border-red-300 dark:border-red-600 focus:border-red-300 dark:focus:border-red-600",
                            className
                        )}
                        {...props}
                    />

                    {Icon && iconPosition === 'right' && (
                        <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                </div>

                {(error || helperText) && (
                    <p className={cn(
                        "text-xs",
                        error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

UnifiedInput.displayName = "UnifiedInput";

export const UnifiedSelect = React.forwardRef<HTMLButtonElement, UnifiedSelectProps>(
    ({
        label,
        error,
        helperText,
        placeholder = "Seleccionar...",
        value,
        onValueChange,
        options,
        fullWidth = false,
        className,
        ...props
    }, ref) => {
        const selectId = React.useId();

        return (
            <div className={cn("space-y-2", fullWidth && "w-full")}>
                {label && (
                    <Label htmlFor={selectId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </Label>
                )}

                <Select value={value} onValueChange={onValueChange}>
                    <SelectTrigger
                        ref={ref}
                        id={selectId}
                        className={cn(
                            unifiedStyles.selectTrigger,
                            error && "border-red-300 dark:border-red-600",
                            className
                        )}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.filter(option => !option.disabled).map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(error || helperText) && (
                    <p className={cn(
                        "text-xs",
                        error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                    )}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

UnifiedSelect.displayName = "UnifiedSelect";

// Componente de grupo de campos para formularios
export interface UnifiedFieldGroupProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const UnifiedFieldGroup: React.FC<UnifiedFieldGroupProps> = ({
    children,
    columns = 1,
    gap = 'md',
    className
}) => {
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    };

    const gapStyles = {
        sm: "gap-3",
        md: "gap-4",
        lg: "gap-6"
    };

    return (
        <div className={cn("grid", gridCols[columns], gapStyles[gap], className)}>
            {children}
        </div>
    );
};
