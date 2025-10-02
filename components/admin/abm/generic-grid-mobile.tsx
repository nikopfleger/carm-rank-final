"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import {
    Edit,
    Eye,
    EyeOff,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { GenericGridProps, GridAction, GridColumn } from "./generic-grid-responsive";

export function GenericGridMobile({
    title,
    columns,
    actions,
    data,
    loading = false,
    onRefresh,
    onAdd,
    onEdit,
    onDelete,
    onRestore,
    onView,
    searchable = true,
    searchPlaceholder = "Buscar...",
    showDeleted = false,
    onToggleShowDeleted,
    emptyMessage = "No hay datos disponibles",
    searchFields = [],
    entityName = "registro",
    includeAddButton = true,
    includeEditButton = true,
    includeDeleteButton = true,
    includeRestoreButton = true
}: GenericGridProps) {
    const { t } = useI18nContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({
        isOpen: false,
        item: null
    });
    const [expandedActions, setExpandedActions] = useState<number | null>(null);

    // Generar acciones automáticamente si no se proporcionan (memoizado)
    const defaultActions: GridAction[] = useMemo(() => {
        const defs: GridAction[] = [];
        if (onEdit && includeEditButton) {
            defs.push({
                key: 'edit',
                label: t('common.edit', 'Editar'),
                icon: Edit,
                variant: 'outline',
                onClick: onEdit
            });
        }
        if (onDelete && includeDeleteButton) {
            defs.push({
                key: 'delete',
                label: t('common.delete', 'Eliminar'),
                icon: Trash2,
                variant: 'destructive',
                onClick: (row: any) => setDeleteConfirm({ isOpen: true, item: row }),
                show: (row: any) => !row.deleted
            });
        }
        if (onRestore && includeRestoreButton) {
            defs.push({
                key: 'restore',
                label: 'Restaurar',
                icon: RefreshCw,
                variant: 'outline',
                onClick: onRestore,
                show: (row: any) => row.deleted
            });
        }
        if (onView) {
            defs.push({
                key: 'view',
                label: 'Ver',
                icon: Eye,
                variant: 'ghost',
                onClick: onView
            });
        }
        return defs;
    }, [onEdit, includeEditButton, onDelete, includeDeleteButton, onRestore, includeRestoreButton, onView, t]);

    const finalActions = useMemo(() => actions || defaultActions, [actions, defaultActions]);

    // Funciones para manejar la confirmación de eliminación
    const handleConfirmDelete = () => {
        if (deleteConfirm.item && onDelete) {
            onDelete(deleteConfirm.item);
        }
        setDeleteConfirm({ isOpen: false, item: null });
    };

    const handleCancelDelete = () => {
        setDeleteConfirm({ isOpen: false, item: null });
    };

    // Filtrar datos por término de búsqueda
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((row) =>
            columns.some((column) => {
                const value = column.key.includes('.')
                    ? getNestedValue(row, column.key)
                    : row[column.key];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, columns]);

    function getNestedValue(obj: any, path: string) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    const renderCellValue = (column: GridColumn, value: any, row: any) => {
        if (column.render) {
            return column.render(value, row);
        }

        const actualValue = value === undefined && column.key.includes('.')
            ? getNestedValue(row, column.key)
            : value;

        switch (column.type) {
            case 'boolean':
                return (
                    <Badge variant={actualValue ? 'default' : 'secondary'} className="text-xs">
                        {actualValue ? 'Sí' : 'No'}
                    </Badge>
                );
            case 'date':
                return actualValue ? formatYmdForDisplay(toYmd(actualValue as any), 'es-AR') : '-';
            case 'badge':
                return (
                    <Badge variant="outline" className="text-xs">
                        {actualValue !== undefined && actualValue !== null ? actualValue : '-'}
                    </Badge>
                );
            default:
                return actualValue !== undefined && actualValue !== null ? actualValue : '-';
        }
    };

    // Obtener las columnas principales para mostrar (máximo 3)
    const primaryColumns = columns.slice(0, 3);
    const secondaryColumns = columns.slice(3);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {title}
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {onToggleShowDeleted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleShowDeleted}
                                className="flex items-center gap-1 text-xs px-2"
                            >
                                {showDeleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span className="hidden sm:inline">
                                    {showDeleted ? 'Ocultar' : 'Mostrar'}
                                </span>
                            </Button>
                        )}
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="flex items-center gap-1 text-xs px-2"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span className="hidden sm:inline">Actualizar</span>
                            </Button>
                        )}
                        {onAdd && includeAddButton && (
                            <Button
                                onClick={onAdd}
                                size="sm"
                                className="flex items-center gap-1 text-xs px-2"
                            >
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">Agregar</span>
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {searchable && (
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {t('common.loading', 'Cargando...')}
                        </div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredData.map((row, index) => (
                            <Card
                                key={row.id || index}
                                className={`transition-colors ${row.deleted
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-75'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <CardContent className="p-4">
                                    {/* Información principal */}
                                    <div className="space-y-2">
                                        {primaryColumns.map((column) => {
                                            const value = column.key.includes('.')
                                                ? getNestedValue(row, column.key)
                                                : row[column.key];

                                            return (
                                                <div key={column.key} className="flex justify-between items-start">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-0 flex-1">
                                                        {column.label}:
                                                    </span>
                                                    <span className="text-sm text-gray-900 dark:text-gray-100 ml-2 break-words text-right">
                                                        {renderCellValue(column, value, row)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Información secundaria (colapsable) */}
                                    {secondaryColumns.length > 0 && (
                                        <details className="mt-3">
                                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                                Más detalles ({secondaryColumns.length} campos)
                                            </summary>
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                                                {secondaryColumns.map((column) => {
                                                    const value = column.key.includes('.')
                                                        ? getNestedValue(row, column.key)
                                                        : row[column.key];

                                                    return (
                                                        <div key={column.key} className="flex justify-between items-start">
                                                            <span className="text-xs font-medium text-gray-500 min-w-0 flex-1">
                                                                {column.label}:
                                                            </span>
                                                            <span className="text-xs text-gray-700 dark:text-gray-300 ml-2 break-words text-right">
                                                                {renderCellValue(column, value, row)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    )}

                                    {/* Acciones */}
                                    {finalActions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-end gap-1">
                                                {finalActions.slice(0, 2).map((action) => {
                                                    const Icon = action.icon;
                                                    const show = action.show ? action.show(row) : true;

                                                    if (!show) return null;

                                                    return (
                                                        <Button
                                                            key={action.key}
                                                            variant={action.variant || 'ghost'}
                                                            size="sm"
                                                            onClick={() => action.onClick(row)}
                                                            className="h-8 px-2 text-xs"
                                                            title={action.label}
                                                        >
                                                            <Icon className="w-3 h-3 mr-1" />
                                                            {action.label}
                                                        </Button>
                                                    );
                                                })}

                                                {finalActions.length > 2 && (
                                                    <div className="relative">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpandedActions(expandedActions === index ? null : index)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreVertical className="w-3 h-3" />
                                                        </Button>

                                                        {expandedActions === index && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-[120px]">
                                                                {finalActions.slice(2).map((action) => {
                                                                    const Icon = action.icon;
                                                                    const show = action.show ? action.show(row) : true;

                                                                    if (!show) return null;

                                                                    return (
                                                                        <button
                                                                            key={action.key}
                                                                            onClick={() => {
                                                                                action.onClick(row);
                                                                                setExpandedActions(null);
                                                                            }}
                                                                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                        >
                                                                            <Icon className="w-3 h-3" />
                                                                            {action.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {filteredData.length > 0 && (
                    <div className="mt-4 text-xs text-gray-500 text-center">
                        {t('ui.showing', 'Mostrando')} {filteredData.length} {t('ui.of', 'de')} {data.length} registros
                    </div>
                )}
            </CardContent>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar este {entityName}?
                            <br />
                            <span className="text-sm text-gray-500">
                                El {entityName} se marcará como eliminado pero se puede restaurar.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelDelete}>
                            {t('ui.cancel', 'Cancelar')}
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            {t('common.delete', 'Eliminar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
