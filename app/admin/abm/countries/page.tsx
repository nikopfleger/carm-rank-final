"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import UnifiedABMLayout from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { useCrud } from "@/hooks/use-crud";
import { useMemo } from "react";

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
  const abm = useCrud<Country>({ resource: 'countries' });

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

  // Usamos acciones genéricas del grid (sin confirm del browser)
  const actions: GridAction[] = useMemo(() => [], []);

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
      loading={abm.loading}

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
      onEditRow={abm.handleEdit}
      onDeleteRow={abm.handleDelete}
      onRestoreRow={abm.handleRestore}
      onFormSubmit={abm.handleFormSubmit}
      onFormCancel={abm.handleCancel}

      // Empty
      emptyMessage="No hay países registrados"
    />
  );
}
