"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { Badge } from "@/components/ui/badge";
import { useCrud } from "@/hooks/use-crud";
import dynamic from "next/dynamic";
import { useMemo } from "react";
const UnifiedABMLayout = dynamic(() => import("@/components/admin/abm/unified-abm-layout").then(m => m.UnifiedABMLayout));

interface Ruleset {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  deleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function RulesetsABMPage() {
  const abm = useCrud<Ruleset>({ resource: 'rulesets' });


  // Configuración de columnas del grid
  const columns: GridColumn[] = useMemo(() => [
    {
      key: "id",
      label: "ID",
      sortable: true,
      type: "number",
      width: "80px"
    },
    {
      key: "name",
      label: "Nombre",
      sortable: true,
      type: "text"
    },
    {
      key: "description",
      label: "Descripción",
      sortable: false,
      type: "text",
      render: (value: string | null) => value !== null && value !== undefined ? value : '-'
    },
    {
      key: "isActive",
      label: "Activo",
      sortable: true,
      type: "boolean",
      width: "100px",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
    {
      key: "deleted",
      label: "Estado",
      type: "boolean",
      width: "100px",
      render: (value: boolean) => (
        <Badge variant={value ? "destructive" : "default"}>
          {value ? "Eliminado" : "Activo"}
        </Badge>
      )
    }
  ], []);

  // Configuración de campos del formulario
  const formFields: FormField[] = useMemo(() => [
    { key: "name", label: "Nombre", type: "text", required: true },
    { key: "description", label: "Descripción", type: "textarea", required: false },
    { key: "isActive", label: "Activo", type: "boolean", required: false }
  ], []);

  // Configuración de acciones del grid
  const actions: GridAction[] = useMemo(() => [], []);

  return (
    <UnifiedABMLayout
      title="Reglas de Juego"
      description="Gestiona las reglas y configuraciones del sistema de juego"

      // Estado del formulario
      showForm={abm.showForm}
      editingItem={abm.editingItem}
      formTitle={abm.editingItem ?
        `Editar Regla: ${abm.editingItem.name}` :
        "Nueva Regla"
      }

      // Configuración del grid
      data={abm.data}
      columns={columns}
      actions={actions}
      loading={abm.loading}

      // Configuración del formulario
      formFields={formFields}
      formErrors={abm.formErrors}
      formSuccess={abm.formSuccess}
      successMessage="Regla guardada correctamente"

      // Configuración de búsqueda y filtros
      searchPlaceholder="Buscar reglas..."
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
      emptyMessage="No hay reglas registradas"
    />
  );
}