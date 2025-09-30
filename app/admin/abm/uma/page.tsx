"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { useCrud } from "@/hooks/use-crud";
import { useMemo } from "react";

interface Uma {
  id: number;
  name: string;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number;
  version: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UmaABMPage() {
  const abm = useCrud<Uma>({ resource: 'uma' });

  // Configuración de campos del formulario
  const formFields: FormField[] = useMemo(() => [
    {
      key: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'ej: UMA Estándar, UMA Torneo'
    },
    {
      key: 'firstPlace',
      label: '1er Lugar',
      type: 'number',
      required: true,
      placeholder: '30'
    },
    {
      key: 'secondPlace',
      label: '2do Lugar',
      type: 'number',
      required: true,
      placeholder: '10'
    },
    {
      key: 'thirdPlace',
      label: '3er Lugar',
      type: 'number',
      required: true,
      placeholder: '-10'
    },
    {
      key: 'fourthPlace',
      label: '4to Lugar',
      type: 'number',
      required: true,
      placeholder: '-30'
    }
  ], []);

  // Configuración de columnas del grid
  const columns: GridColumn[] = useMemo(() => [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      sortable: true
    },
    {
      key: 'name',
      label: 'Nombre',
      width: '200px',
      sortable: true
    },
    {
      key: 'firstPlace',
      label: '1er Lugar',
      width: '100px',
      type: 'number',
      sortable: true
    },
    {
      key: 'secondPlace',
      label: '2do Lugar',
      width: '100px',
      type: 'number',
      sortable: true
    },
    {
      key: 'thirdPlace',
      label: '3er Lugar',
      width: '100px',
      type: 'number',
      sortable: true
    },
    {
      key: 'fourthPlace',
      label: '4to Lugar',
      width: '100px',
      type: 'number',
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
    }
  ], []);

  // Note: CRUD genérico maneja load/create/update/delete/restore


  // Configuración de acciones del grid
  const actions: GridAction[] = useMemo(() => [], []);

  return (
    <UnifiedABMLayout<Uma>
      title="Administración de UMA"
      description="Configura sistemas de puntuación UMA"

      // Estado del formulario
      showForm={abm.showForm}
      editingItem={abm.editingItem}

      // Configuración del grid
      data={abm.data}
      columns={columns}
      actions={actions}
      loading={abm.loading}

      // Configuración del formulario
      formFields={formFields}
      formErrors={abm.formErrors}
      formSuccess={abm.formSuccess}
      successMessage="UMA guardado correctamente"

      // Configuración de búsqueda y filtros
      searchPlaceholder="Buscar UMA..."
      showDeleted={abm.showDeleted}
      onToggleShowDeleted={abm.handleToggleShowDeleted}

      // Callbacks
      onAdd={abm.handleAdd}
      onRefresh={abm.handleRefresh}
      onFormSubmit={abm.handleFormSubmit}
      onFormCancel={abm.handleCancel}
      onEditRow={abm.handleEdit}
      onDeleteRow={abm.handleDelete}
      onRestoreRow={abm.handleRestore}

      // Mensajes personalizados
      emptyMessage="No hay configuraciones UMA registradas"
    />
  );
}
