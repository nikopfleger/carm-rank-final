"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import UnifiedABMLayout from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2 } from "@/components/ui/icons";
import { useCountriesOperations } from "@/hooks/use-abm-operations";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import { useCallback, useMemo } from "react";

interface Country {
  id: number;
  isoCode: string;
  fullName: string;
  nationality: string;
  version: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CountriesABMPage() {
  // Hook de operaciones (asegurate de que dentro use callbacks memorizados)
  const { loading, load, create, update, remove, restore } = useCountriesOperations();

  // ✅ funciones estables que le pasamos al hook unificado
  const loadFn = useCallback(async (showDeleted?: boolean) => {
    const result = await load(showDeleted);
    // Normalizamos el shape que espera el hook unificado
    return { data: (result as any)?.data ?? [] };
  }, [load]);

  const createFn = useCallback((data: Partial<Country>) => create(data), [create]);
  const updateFn = useCallback((id: number | string, data: Partial<Country>) => update(Number(id), data), [update]);
  const deleteFn = useCallback((id: number | string) => remove(Number(id)), [remove]);
  const restoreFn = useCallback((id: number | string) => restore(Number(id)), [restore]);

  // Hook unificado de ABM
  const abm = useUnifiedABM<Country>({
    loadFunction: loadFn,
    createFunction: createFn,
    updateFunction: updateFn,
    deleteFunction: deleteFn,
    restoreFunction: restoreFn
  });

  // ===== Config del grid =====
  const columns: GridColumn[] = useMemo(() => [
    {
      key: 'isoCode',
      label: 'Código ISO',
      type: 'badge',
      width: '120px',
      sortable: true
    },
    {
      key: 'fullName',
      label: 'Nombre Completo',
      sortable: true
    },
    {
      key: 'nationality',
      label: 'Nacionalidad',
      sortable: true
    },
    {
      key: 'version',
      label: 'Versión',
      type: 'badge',
      width: '80px',
      sortable: true
    },
    {
      key: 'deleted',
      label: 'Estado',
      type: 'boolean',
      width: '100px',
      render: (value: boolean) => (
        <Badge variant={value ? 'destructive' : 'default'}>
          {value ? 'Eliminado' : 'Activo'}
        </Badge>
      )
    },
    {
      key: 'updatedAt',
      label: 'Última Modificación',
      type: 'date',
      width: '150px',
      sortable: true
    }
  ], []);

  // Handlers estables para acciones (no dependas del objeto `abm` entero)
  const onEdit = useCallback((row: Country) => abm.handleEdit(row), [abm]);
  const onDelete = useCallback((row: Country) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el país "${row.fullName}"?`)) {
      abm.handleDelete(row);
    }
  }, [abm]);
  const onRestore = useCallback((row: Country) => abm.handleRestore(row), [abm]);

  const actions: GridAction[] = useMemo(() => [
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline',
      onClick: onEdit,
      show: (row: Country) => !row.deleted
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: onDelete,
      show: (row: Country) => !row.deleted
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: Eye,
      variant: 'outline',
      onClick: onRestore,
      show: (row: Country) => row.deleted
    }
  ], [onEdit, onDelete, onRestore]);

  // ===== Form =====
  const formFields: FormField[] = useMemo(() => [
    {
      key: 'isoCode',
      label: 'Código ISO',
      type: 'text',
      required: true,
      placeholder: 'ej: ARG, USA, JPN',
      validation: {
        pattern: /^[A-Z]{3}$/,
        message: 'Debe ser un código de 3 letras mayúsculas'
      },
      helpText: 'Código de 3 letras según estándar ISO 3166-1'
    },
    {
      key: 'fullName',
      label: 'Nombre Completo',
      type: 'text',
      required: true,
      placeholder: 'ej: Argentina, Estados Unidos, Japón'
    },
    {
      key: 'nationality',
      label: 'Nacionalidad',
      type: 'text',
      required: true,
      placeholder: 'ej: Argentino, Estadounidense, Japonés'
    }
  ], []);

  return (
    <UnifiedABMLayout
      title="Administración de Países"
      description="Gestiona los países y nacionalidades del sistema"

      // Estado del formulario
      showForm={abm.showForm}
      editingItem={abm.editingItem}

      // Grid
      data={abm.data}
      columns={columns}
      actions={actions}
      loading={abm.loading || loading}

      // Form
      formFields={formFields}
      formErrors={abm.formErrors}
      formSuccess={abm.formSuccess}
      successMessage="País guardado correctamente"

      // Búsqueda / filtros
      searchPlaceholder="Buscar países..."
      showDeleted={abm.showDeleted}
      onToggleShowDeleted={abm.handleToggleShowDeleted}

      // Callbacks
      onAdd={abm.handleAdd}
      onRefresh={abm.handleRefresh}
      onFormSubmit={abm.handleFormSubmit}
      onFormCancel={abm.handleFormCancel}

      // Empty
      emptyMessage="No hay países registrados"
    />
  );
}
