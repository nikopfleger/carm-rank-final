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
import React, { useState } from "react";

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

export function GenericGrid({
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

  // Generar acciones automáticamente si no se proporcionan
  const defaultActions: GridAction[] = [];
  if (onEdit) {
    defaultActions.push({
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline',
      onClick: onEdit
    });
  }
  if (onDelete) {
    defaultActions.push({
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row: any) => setDeleteConfirm({ isOpen: true, item: row }),
      show: (row: any) => !row.deleted
    });
  }
  if (onRestore) {
    defaultActions.push({
      key: 'restore',
      label: 'Restaurar',
      icon: RefreshCw,
      variant: 'outline',
      onClick: onRestore,
      show: (row: any) => row.deleted
    });
  }
  if (onView) {
    defaultActions.push({
      key: 'view',
      label: 'Ver',
      icon: Eye,
      variant: 'ghost',
      onClick: onView
    });
  }

  const finalActions = actions || defaultActions;

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

  // Ordenar datos
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = sortColumn.includes('.')
        ? getNestedValue(a, sortColumn)
        : a[sortColumn];
      const bValue = sortColumn.includes('.')
        ? getNestedValue(b, sortColumn)
        : b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const renderCellValue = (column: GridColumn, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    // Si el valor es undefined y la columna tiene un key con puntos, intentar obtener el valor anidado
    const actualValue = value === undefined && column.key.includes('.')
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
        return (
          <Badge variant="outline">
            {actualValue !== undefined && actualValue !== null ? actualValue : '-'}
          </Badge>
        );
      default:
        return actualValue !== undefined && actualValue !== null ? actualValue : '-';
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
                <span className="hidden sm:inline">{showDeleted ? 'Ocultar Eliminados' : 'Mostrar Eliminados'}</span>
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
                    className={`text-left p-2 sm:p-3 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm ${column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                      }`}
                    style={{ width: column.width, minWidth: column.width || '100px' }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
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
                    key={row.id || index}
                    className={`border-b transition-colors ${row.deleted
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-75'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="p-2 sm:p-3 text-xs sm:text-sm">
                        <div className="truncate max-w-[150px] sm:max-w-none" title={String(renderCellValue(column, row[column.key], row))}>
                          {renderCellValue(column, row[column.key], row)}
                        </div>
                      </td>
                    ))}
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

      {/* Diálogo de confirmación de eliminación */}
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
