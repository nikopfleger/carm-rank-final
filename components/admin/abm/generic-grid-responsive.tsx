"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ConfirmationModal,
    UnifiedButton,
    UnifiedCard,
    UnifiedCardContent,
    UnifiedCardHeader,
    UnifiedCardTitle,
    UnifiedInput
} from "@/components/ui/unified";
import {
    Edit,
    Eye,
    EyeOff,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react";
import React, { useMemo, useState } from "react";

export interface GridColumn {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'boolean' | 'badge';
    width?: string;
    render?: (value: any, row: any) => React.ReactNode;
    sortable?: boolean;
}

export interface GridAction {
    key: string;
    label: string;
    icon: React.ComponentType<any>;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: (row: any) => void;
    show?: (row: any) => boolean;
}

export interface GenericGridProps {
    title?: string;
    columns: GridColumn[];
    actions?: GridAction[];
    data: any[];
    loading?: boolean;
    onRefresh?: () => void;
    onAdd?: () => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    onRestore?: (row: any) => void;
    onView?: (row: any) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    showDeleted?: boolean;
    searchFields?: string[];
    entityName?: string;
    onToggleShowDeleted?: () => void;
    emptyMessage?: string;
}

function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Convierte un valor (o ReactNode simple) a texto para el title del <td>
function toPlainText(x: any): string {
    if (x == null) return "-";
    if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
    // evita volver a renderizar celdas dentro del title
    return "";
}

function _GenericGrid({
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
    entityName = "registro"
}: GenericGridProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({
        isOpen: false,
        item: null
    });

    // Acciones por defecto (memoizadas para no recrearlas si las props no cambian)
    const finalActions = useMemo<GridAction[]>(() => {
        if (actions && actions.length) return actions;

        const defaults: GridAction[] = [];
        if (onEdit) {
            defaults.push({
                key: 'edit',
                label: 'Editar',
                icon: Edit,
                variant: 'outline',
                onClick: onEdit
            });
        }
        if (onDelete) {
            defaults.push({
                key: 'delete',
                label: 'Eliminar',
                icon: Trash2,
                variant: 'destructive',
                onClick: (row: any) => setDeleteConfirm({ isOpen: true, item: row }),
                show: (row: any) => !row.deleted
            });
        }
        if (onRestore) {
            defaults.push({
                key: 'restore',
                label: 'Restaurar',
                icon: RefreshCw,
                variant: 'outline',
                onClick: onRestore,
                show: (row: any) => row.deleted
            });
        }
        if (onView) {
            defaults.push({
                key: 'view',
                label: 'Ver',
                icon: Eye,
                variant: 'ghost',
                onClick: onView
            });
        }
        return defaults;
    }, [actions, onEdit, onDelete, onRestore, onView]);

    const handleConfirmDelete = () => {
        if (deleteConfirm.item && onDelete) onDelete(deleteConfirm.item);
        setDeleteConfirm({ isOpen: false, item: null });
    };
    const handleCancelDelete = () => setDeleteConfirm({ isOpen: false, item: null });

    // Filtro local (memoizado)
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        const term = searchTerm.toLowerCase();
        const keys = (searchFields.length ? searchFields : columns.map(c => c.key));

        return data.filter((row) =>
            keys.some((key) => {
                const value = key.includes('.') ? getNestedValue(row, key) : row[key];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(term);
            })
        );
    }, [data, searchTerm, columns, searchFields]);

    // Orden local (memoizado)
    const sortedData = useMemo(() => {
        if (!sortColumn) return filteredData;

        const arr = [...filteredData];
        arr.sort((a, b) => {
            const aValue = sortColumn.includes('.') ? getNestedValue(a, sortColumn) : a[sortColumn];
            const bValue = sortColumn.includes('.') ? getNestedValue(b, sortColumn) : b[sortColumn];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // soporto number + string
            const aComp = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
            const bComp = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;

            let comparison = 0;
            if (aComp < bComp) comparison = -1;
            if (aComp > bComp) comparison = 1;

            return sortDirection === 'asc' ? comparison : -comparison;
        });
        return arr;
    }, [filteredData, sortColumn, sortDirection]);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const renderCellValue = (column: GridColumn, value: any, row: any) => {
        if (column.render) return column.render(value, row);

        const actualValue = (value === undefined && column.key.includes('.'))
            ? getNestedValue(row, column.key)
            : value;

        switch (column.type) {
            case 'boolean':
                return (
                    <Badge variant={actualValue ? 'default' : 'secondary'}>
                        {actualValue ? 'Sí' : 'No'}
                    </Badge>
                );
            case 'date':
                return actualValue ? new Date(actualValue).toLocaleDateString() : '-';
            case 'badge':
                return <Badge variant="outline">{actualValue ?? '-'}</Badge>;
            default:
                return actualValue ?? '-';
        }
    };

    return (
        <UnifiedCard variant="elevated" hover>
            <UnifiedCardHeader
                actions={
                    <div className="flex items-center gap-1 sm:gap-2">
                        {onToggleShowDeleted && (
                            <UnifiedButton
                                variant="outline"
                                size="sm"
                                onClick={onToggleShowDeleted}
                                icon={showDeleted ? EyeOff : Eye}
                                className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <span className="hidden sm:inline">
                                    {showDeleted ? 'Ocultar Eliminados' : 'Mostrar Eliminados'}
                                </span>
                                <span className="sm:hidden">{showDeleted ? 'Ocultar' : 'Mostrar'}</span>
                            </UnifiedButton>
                        )}
                        {onRefresh && (
                            <UnifiedButton
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                icon={RefreshCw}
                                className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <span className="hidden sm:inline">Actualizar</span>
                            </UnifiedButton>
                        )}
                        {onAdd && (
                            <UnifiedButton
                                variant="primary"
                                size="sm"
                                onClick={onAdd}
                                icon={Plus}
                                className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <span className="hidden sm:inline">Agregar</span>
                            </UnifiedButton>
                        )}
                    </div>
                }
            >
                <UnifiedCardTitle className="flex items-center gap-2">
                    {title}
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                </UnifiedCardTitle>
            </UnifiedCardHeader>

            <UnifiedCardContent>
                {searchable && (
                    <div className="mb-4">
                        <UnifiedInput
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                            fullWidth
                        />
                    </div>
                )}

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                    <table className="w-full border-collapse min-w-max">
                        <thead>
                            <tr className="border-b">
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`text-left p-2 sm:p-3 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm ${column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                                        style={{ width: column.width, minWidth: column.width || '100px' }}
                                        onClick={() => column.sortable && handleSort(column.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {column.sortable && sortColumn === column.key && (
                                                <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {finalActions.length > 0 && (
                                    <th className="text-left p-2 sm:p-3 font-medium text-gray-700 dark:text-gray-300 w-24 sm:w-32 text-xs sm:text-sm">
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + (finalActions.length > 0 ? 1 : 0)} className="p-8 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Cargando...
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (finalActions.length > 0 ? 1 : 0)} className="p-8 text-center text-gray-500">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, index) => (
                                    <tr
                                        key={row.id ?? index}
                                        className={`border-b transition-colors ${row.deleted
                                            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-75'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {columns.map((column) => {
                                            const raw = column.key.includes('.') ? getNestedValue(row, column.key) : row[column.key];
                                            const cell = renderCellValue(column, raw, row);
                                            const titleText = toPlainText(raw);
                                            return (
                                                <td key={column.key} className="p-2 sm:p-3 text-xs sm:text-sm" title={titleText}>
                                                    <div className="truncate max-w-[150px] sm:max-w-none">
                                                        {cell}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        {finalActions.length > 0 && (
                                            <td className="p-2 sm:p-3">
                                                <div className="flex items-center gap-0.5 sm:gap-1">
                                                    {finalActions.map((action) => {
                                                        const Icon = action.icon;
                                                        const show = action.show ? action.show(row) : true;
                                                        if (!show) return null;

                                                        return (
                                                            <Button
                                                                key={action.key}
                                                                variant={action.variant || 'ghost'}
                                                                size="sm"
                                                                onClick={() => action.onClick(row)}
                                                                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                                                title={action.label}
                                                            >
                                                                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedData.length > 0 && (
                    <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
                        Mostrando {sortedData.length} de {data.length} registros
                    </div>
                )}
            </UnifiedCardContent>

            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmar eliminación"
                description={`¿Estás seguro de que deseas eliminar este ${entityName}? El ${entityName} se marcará como eliminado pero se puede restaurar.`}
                variant="danger"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </UnifiedCard>
    );
}

// ⛑️ Memo para evitar renders innecesarios si las props no cambian.
// Útil cuando el padre re-crea objetos pero con igual contenido.
export const GenericGridResponsive = React.memo(_GenericGrid);
export default GenericGridResponsive;
