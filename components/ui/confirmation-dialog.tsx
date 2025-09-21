"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "success";
    onConfirm: () => void;
    onCancel?: () => void;
    loading?: boolean;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmationDialogProps) {
    const handleConfirm = () => {
        onConfirm();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    const getIcon = () => {
        switch (variant) {
            case "destructive":
                return <XCircle className="h-6 w-6 text-destructive" />;
            case "success":
                return <CheckCircle className="h-6 w-6 text-green-600" />;
            default:
                return <AlertTriangle className="h-6 w-6 text-amber-600" />;
        }
    };

    const getConfirmButtonVariant = () => {
        switch (variant) {
            case "destructive":
                return "destructive";
            case "success":
                return "default";
            default:
                return "default";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <DialogTitle className="text-left">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-left">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={getConfirmButtonVariant()}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Procesando..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
