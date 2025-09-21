"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { useRulesetsOperations } from "@/hooks/use-rulesets-operations";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useEffect } from "react";

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
  // Usar el hook personalizado para operaciones ABM
  const { loading, load, create, update, remove, restore } = useRulesetsOperations();

  // Usar el hook unificado de ABM
  const abm = useUnifiedABM<Ruleset>({
    loadFunction: async (showDeleted?: boolean) => {
      const result = await load(showDeleted);
      return result;
    },
    createFunction: create,
    updateFunction: (id: number | string, data: Partial<Ruleset>) => update(Number(id), data),
    deleteFunction: (id: number | string) => remove(Number(id)),
    restoreFunction: (id: number | string) => restore(Number(id))
  });

  useEffect(() => {
    abm.loadData();
  }, [abm.showDeleted]);

  // Configuración de columnas del grid
  const columns: GridColumn[] = [
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
    },
    {
      key: "version",
      label: "Versión",
      sortable: true,
      type: "number",
      width: "100px"
    },
    {
      key: "createdAt",
      label: "Creado",
      sortable: true,
      type: "date",
      width: "150px"
    }
  ];

  // Configuración de campos del formulario
  const formFields: FormField[] = [
    { key: "name", label: "Nombre", type: "text", required: true },
    { key: "description", label: "Descripción", type: "textarea", required: false },
    { key: "isActive", label: "Activo", type: "boolean", required: false }
  ];

  // Configuración de acciones del grid
  const actions: GridAction[] = [
    {
      key: "edit",
      label: "Editar",
      icon: Edit,
      variant: "outline",
      onClick: (row: Ruleset) => abm.handleEdit(row),
      show: (row: Ruleset) => !row.deleted
    },
    {
      key: "delete",
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: (row: Ruleset) => {
        if (confirm(`¿Estás seguro de que quieres eliminar la regla "${row.name}"?`)) {
          abm.handleDelete(row);
        }
      },
      show: (row: Ruleset) => !row.deleted
    },
    {
      key: "restore",
      label: "Restaurar",
      icon: Eye,
      variant: "outline",
      onClick: (row: Ruleset) => abm.handleRestore(row),
      show: (row: Ruleset) => row.deleted
    }
  ];

  return (
    <UnifiedABMLayout<Ruleset>
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
      showDeleted={false}
      onToggleShowDeleted={undefined}

      // Callbacks
      onAdd={abm.handleAdd}
      onRefresh={abm.handleRefresh}
      onFormSubmit={abm.handleFormSubmit}
      onFormCancel={abm.handleFormCancel}

      // Mensajes personalizados
      emptyMessage="No hay reglas registradas"
    />
  );
}