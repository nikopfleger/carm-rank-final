"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { Badge } from "@/components/ui/badge";
import { useCrud } from "@/hooks/use-crud";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
const UnifiedABMLayout = dynamic(() => import("@/components/admin/abm/unified-abm-layout").then(m => m.UnifiedABMLayout));

interface Ruleset {
  id: number;
  name: string;
  description?: string | null;
  umaId: number;
  oka: number;
  chonbo: number;
  aka: boolean;
  inPoints: number;
  outPoints: number;
  sanma: boolean;
  extraData?: any;
  deleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function RulesetsABMPage() {
  const abm = useCrud<Ruleset>({ resource: 'rulesets' });

  // Estado para opciones de Uma
  const [umaOptions, setUmaOptions] = useState<{ value: number; label: string }[]>([]);

  // Cargar Uma disponibles
  useEffect(() => {
    const loadUmaOptions = async () => {
      try {
        const response = await fetch("/api/abm/uma");
        const result = await response.json();
        const umaData = result.success ? result.data : result;
        setUmaOptions(Array.isArray(umaData) ? umaData.map((uma: any) => ({
          value: uma.id,
          label: uma.name
        })) : []);
      } catch (error) {
        console.error("Error cargando opciones de Uma:", error);
      }
    };

    loadUmaOptions();
  }, []);


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
      key: "uma.name",
      label: "Sistema Uma",
      sortable: false,
      type: "text",
      render: (value: any, row: any) => row.uma?.name || '-'
    },
    {
      key: "oka",
      label: "Oka",
      sortable: true,
      type: "number",
      width: "80px"
    },
    {
      key: "sanma",
      label: "Sanma",
      sortable: true,
      type: "boolean",
      width: "80px",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "3p" : "4p"}
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
    {
      key: "umaId",
      label: "Sistema Uma",
      type: "select",
      required: true,
      options: umaOptions,
      coerceToNumber: true
    },
    { key: "oka", label: "Oka", type: "number", required: true },
    { key: "chonbo", label: "Chonbo (penalización)", type: "number", required: true },
    { key: "aka", label: "Dora rojas (Aka)", type: "boolean", required: false },
    { key: "inPoints", label: "Puntos de entrada", type: "number", required: true },
    { key: "outPoints", label: "Puntos de salida", type: "number", required: true },
    { key: "sanma", label: "Modo 3 jugadores (Sanma)", type: "boolean", required: false }
  ], [umaOptions]);

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