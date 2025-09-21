"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { Badge } from "@/components/ui/badge";
import { useCountriesOperations } from "@/hooks/use-abm-operations";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useEffect } from "react";

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
  // Usar el hook personalizado para operaciones ABM
  const { loading, load, create, update, remove, restore } = useCountriesOperations();

  // Usar el hook unificado de ABM
  const abm = useUnifiedABM<Country>({
    loadFunction: async (showDeleted?: boolean) => {
      const result = await load(showDeleted);
      return { data: (result as any).data || [] };
    },
    createFunction: create,
    updateFunction: (id: number | string, data: Partial<Country>) => update(Number(id), data),
    deleteFunction: (id: number | string) => remove(Number(id)),
    restoreFunction: (id: number | string) => restore(Number(id))
  });

  useEffect(() => {
    abm.loadData();
  }, [abm.showDeleted]);

  // Configuración de columnas del grid
  const columns: GridColumn[] = [
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
  ];

  // Configuración de acciones del grid
  const actions: GridAction[] = [
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline',
      onClick: (row: Country) => abm.handleEdit(row),
      show: (row: Country) => !row.deleted
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row: Country) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el país "${row.fullName}"?`)) {
          abm.handleDelete(row);
        }
      },
      show: (row: Country) => !row.deleted
    },
    {
      key: 'restore',
      label: 'Restaurar',
      icon: Eye,
      variant: 'outline',
      onClick: (row: Country) => abm.handleRestore(row),
      show: (row: Country) => row.deleted
    }
  ];

  // Configuración de campos del formulario
  const formFields: FormField[] = [
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
  ];

  return (
    <UnifiedABMLayout<Country>
      title="Administración de Países"
      description="Gestiona los países y nacionalidades del sistema"

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
      successMessage="País guardado correctamente"

      // Configuración de búsqueda y filtros
      searchPlaceholder="Buscar países..."
      showDeleted={abm.showDeleted}
      onToggleShowDeleted={abm.handleToggleShowDeleted}

      // Callbacks
      onAdd={abm.handleAdd}
      onRefresh={abm.handleRefresh}
      onFormSubmit={abm.handleFormSubmit}
      onFormCancel={abm.handleFormCancel}

      // Mensajes personalizados
      emptyMessage="No hay países registrados"
    />
  );
}
