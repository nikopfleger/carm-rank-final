"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { SeasonCloseModal } from "@/components/admin/season-close-modal";
import { Badge } from "@/components/ui/badge";
import { useSeasonsABM } from "@/hooks/use-seasons-abm";
import { Edit, Eye, Power, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isClosed: boolean;
  extraData?: any;
  version: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SeasonsABMPage() {
  // Usar el hook especializado para Seasons
  const abm = useSeasonsABM();

  useEffect(() => {
    abm.loadData();
  }, [abm, abm.showDeleted]);

  // Configuración de columnas del grid
  const columns: GridColumn[] = [
    {
      key: "id",
      label: "ID",
      width: "80px",
      sortable: true,
      type: "number"
    },
    {
      key: "name",
      label: "Nombre",
      width: "200px",
      sortable: true,
      type: "text"
    },
    {
      key: "startDate",
      label: "Inicio",
      width: "120px",
      type: "date",
      sortable: true
    },
    {
      key: "endDate",
      label: "Fin",
      width: "120px",
      type: "date",
      sortable: true,
      render: (value: string | undefined) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: "isActive",
      label: "Activa",
      width: "100px",
      type: "boolean",
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activa" : "Inactiva"}
        </Badge>
      )
    },
    {
      key: "isClosed",
      label: "Cerrada",
      width: "100px",
      type: "boolean",
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "destructive" : "outline"}>
          {value ? "Cerrada" : "Abierta"}
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
          {value ? "Eliminada" : "Activa"}
        </Badge>
      )
    },
    {
      key: "createdAt",
      label: "Creada",
      width: "150px",
      type: "date",
      sortable: true
    }
  ];

  // Configuración de campos del formulario
  const formFields: FormField[] = [
    { key: "name", label: "Nombre", type: "text", required: true },
    { key: "startDate", label: "Fecha Inicio", type: "date", required: true },
    { key: "endDate", label: "Fecha Fin", type: "date", required: false },
    { key: "isActive", label: "Activa", type: "boolean", required: false },
    { key: "isClosed", label: "Cerrada", type: "boolean", required: false },
    { key: "extraData", label: "Datos Extra", type: "textarea", required: false }
  ];

  // Configuración de acciones del grid
  const actions: GridAction[] = [
    {
      key: "activate",
      label: "Activar/Cerrar",
      icon: Power,
      variant: "outline",
      onClick: (row: Season) => abm.handleActivateSeason(row),
      show: (row: Season) => !row.deleted && !row.isClosed
    },
    {
      key: "edit",
      label: "Editar",
      icon: Edit,
      variant: "outline",
      onClick: (row: Season) => abm.handleEdit(row),
      show: (row: Season) => !row.deleted
    },
    {
      key: "delete",
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: (row: Season) => {
        if (confirm(`¿Estás seguro de que quieres eliminar la temporada "${row.name}"?`)) {
          abm.handleDelete(row);
        }
      },
      show: (row: Season) => !row.deleted && !row.isActive
    },
    {
      key: "restore",
      label: "Restaurar",
      icon: Eye,
      variant: "outline",
      onClick: (row: Season) => abm.handleRestore(row),
      show: (row: Season) => row.deleted
    }
  ];

  return (
    <>
      <UnifiedABMLayout<Season>
        title="Administración de Temporadas"
        description="Gestiona las temporadas del sistema con funcionalidades de activación y cierre"

        // Estado del formulario
        showForm={abm.showForm}
        editingItem={abm.editingItem}
        formTitle={abm.editingItem ?
          `Editar Temporada: ${abm.editingItem.name}` :
          "Nueva Temporada"
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
        successMessage="Temporada guardada correctamente"

        // Configuración de búsqueda y filtros
        searchPlaceholder="Buscar temporadas..."
        showDeleted={abm.showDeleted}
        onToggleShowDeleted={abm.handleToggleShowDeleted}

        // Callbacks
        onAdd={abm.handleAdd}
        onRefresh={abm.handleRefresh}
        onFormSubmit={abm.handleFormSubmit}
        onFormCancel={abm.handleFormCancel}

        // Mensajes personalizados
        emptyMessage="No hay temporadas registradas"
      />

      {/* Modal especial para cierre de temporadas */}
      {abm.showCloseModal && (() => {
        const currentSeason = abm.data.find(s => s.isActive);
        const adaptSeason = (season: Season | null) => {
          if (!season) return null;
          return {
            ...season,
            startDate: new Date(season.startDate),
            endDate: season.endDate ? new Date(season.endDate) : undefined
          };
        };

        return (
          <SeasonCloseModal
            isOpen={abm.showCloseModal}
            currentSeason={adaptSeason(currentSeason || null)}
            newSeason={adaptSeason(abm.seasonToActivate) as any}
            seasonStats={abm.seasonStats}
            onConfirm={abm.handleConfirmSeasonClose}
            onCancel={abm.handleCancelSeasonClose}
            loading={abm.isClosing}
          />
        );
      })()}
    </>
  );
}