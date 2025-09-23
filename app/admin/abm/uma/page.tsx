"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { useUmaOperations } from "@/hooks/use-abm-operations";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useEffect } from "react";

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

// Configuración de campos del formulario
const formFields: FormField[] = [
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
];

// Configuración de columnas del grid
const columns: GridColumn[] = [
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
  },
  {
    key: 'createdAt',
    label: 'Creado',
    width: '150px',
    type: 'date',
    sortable: true
  }
];

export default function UmaABMPage() {
  // Usar el hook personalizado para operaciones ABM
  const { loading, load, create, update, remove, restore } = useUmaOperations();

  // Usar el hook unificado de ABM
  const abm = useUnifiedABM<Uma>({
    loadFunction: async (showDeleted?: boolean) => {
      const result = await load();
      return { data: result as Uma[] };
    },
    createFunction: create,
    updateFunction: (id: number | string, data: Partial<Uma>) => update(Number(id), data),
    deleteFunction: (id: number | string) => remove(Number(id)),
    restoreFunction: (id: number | string) => restore(Number(id))
  });

  useEffect(() => {
    abm.loadData();
  }, [abm]);

  // Configuración de acciones del grid
  const actions: GridAction[] = [
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline',
      onClick: (row: Uma) => abm.handleEdit(row),
      show: (row: Uma) => !row.deleted
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row: Uma) => {
        if (confirm(`¿Estás seguro de que quieres eliminar la configuración UMA "${row.name}"?`)) {
          abm.handleDelete(row);
        }
      },
      show: (row: Uma) => !row.deleted
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: Eye,
      variant: 'outline',
      onClick: (row: Uma) => abm.handleRestore(row),
      show: (row: Uma) => row.deleted
    }
  ];

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
      onFormCancel={abm.handleFormCancel}

      // Mensajes personalizados
      emptyMessage="No hay configuraciones UMA registradas"
    />
  );
}
