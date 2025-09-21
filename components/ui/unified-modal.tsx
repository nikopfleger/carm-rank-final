"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LucideIcon, X } from "lucide-react";
import React from "react";
import { UnifiedButton } from "./unified-button";

export type UnifiedModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface UnifiedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: UnifiedModalSize;
    icon?: LucideIcon;
    iconColor?: string;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

const modalSizeStyles: Record<UnifiedModalSize, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]"
};

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    icon: Icon,
    iconColor,
    showCloseButton = true,
    closeOnOverlayClick = true,
    children,
    footer,
    className
}) => {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && closeOnOverlayClick) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className={cn(
                    modalSizeStyles[size],
                    "max-h-[90vh] overflow-y-auto",
                    className
                )}
                onPointerDownOutside={(e) => {
                    if (!closeOnOverlayClick) {
                        e.preventDefault();
                    }
                }}
            >
                {(title || description || showCloseButton) && (
                    <DialogHeader className="relative">
                        <div className="flex items-start gap-3">
                            {Icon && (
                                <div className={cn(
                                    "p-2 rounded-lg flex-shrink-0",
                                    iconColor || "bg-blue-100 dark:bg-blue-900/20"
                                )}>
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        iconColor ? "text-current" : "text-blue-600 dark:text-blue-400"
                                    )} />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                {title && (
                                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-8">
                                        {title}
                                    </DialogTitle>
                                )}
                                {description && (
                                    <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {description}
                                    </DialogDescription>
                                )}
                            </div>
                        </div>

                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute right-0 top-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Cerrar modal"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </DialogHeader>
                )}

                <div className="py-4">
                    {children}
                </div>

                {footer && (
                    <DialogFooter>
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Componente especializado para modales de confirmación
export interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'info',
    loading = false
}) => {
    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return { icon: '⚠️', color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' };
            case 'warning':
                return { icon: '⚠️', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' };
            default:
                return { icon: 'ℹ️', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' };
        }
    };

    const iconConfig = getIcon();

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
            closeOnOverlayClick={!loading}
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <UnifiedButton
                        variant="cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </UnifiedButton>
                    <UnifiedButton
                        variant={variant === 'danger' ? 'delete' : 'primary'}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </UnifiedButton>
                </div>
            }
        >
            <div className="flex items-center gap-3 py-2">
                <div className={cn("text-2xl", iconConfig.color)}>
                    {iconConfig.icon}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                    {description || "¿Estás seguro de que deseas continuar?"}
                </div>
            </div>
        </UnifiedModal>
    );
};

// Componente para modales de formulario
export interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title: string;
    description?: string;
    submitText?: string;
    cancelText?: string;
    loading?: boolean;
    children: React.ReactNode;
    icon?: LucideIcon;
}

export const FormModal: React.FC<FormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    submitText = "Guardar",
    cancelText = "Cancelar",
    loading = false,
    children,
    icon
}) => {
    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            icon={icon}
            size="lg"
            closeOnOverlayClick={!loading}
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <UnifiedButton
                        variant="cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </UnifiedButton>
                    <UnifiedButton
                        variant="save"
                        onClick={onSubmit}
                        loading={loading}
                    >
                        {submitText}
                    </UnifiedButton>
                </div>
            }
        >
            {children}
        </UnifiedModal>
    );
};
