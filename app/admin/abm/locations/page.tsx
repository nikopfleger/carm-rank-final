"use client";

import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin } from "@/components/ui/icons";
import { useCrud } from "@/hooks/use-crud";
import dynamic from "next/dynamic";
const UnifiedABMLayout = dynamic(() => import("@/components/admin/abm/unified-abm-layout").then(m => m.UnifiedABMLayout));

interface Location {
    id: number;
    name: string;
    address?: string;
    city?: string;
    country?: string;
    extraData?: any;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        tournaments: number;
        games: number;
    };
}

interface LocationInput {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    extraData?: any;
}

export default function LocationsUnifiedPage() {
    const { t } = useI18nContext();
    const abm = useCrud<Location>({ resource: 'locations' });

    // Funciones de manejo
    // El CRUD genérico maneja add/edit/delete/restore/refresh

    // Configuración de columnas del grid
    const columns: GridColumn[] = [
        {
            key: 'id',
            label: 'ID',
            sortable: true,
            type: 'number',
            width: '80px'
        },
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
            type: 'text'
        },
        {
            key: 'address',
            label: 'Dirección',
            sortable: true,
            type: 'text',
            render: (value: string | undefined) => value || '-'
        },
        {
            key: 'city',
            label: 'Ciudad',
            sortable: true,
            type: 'text',
            width: '150px',
            render: (value: string | undefined) => value || '-'
        },
        {
            key: 'country',
            label: 'País',
            sortable: true,
            type: 'text',
            width: '120px',
            render: (value: string | undefined) => value || '-'
        },
        {
            key: '_count',
            label: 'Uso',
            type: 'text',
            width: '120px',
            render: (value: { tournaments: number; games: number } | undefined) => (
                <div className="flex gap-1 text-xs">
                    <Badge variant="outline" className="text-xs">
                        {value?.tournaments || 0} 🏆
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {value?.games || 0} 🎯
                    </Badge>
                </div>
            )
        },
        {
            key: 'deleted',
            label: 'Estado',
            sortable: true,
            type: 'boolean',
            width: '100px',
            render: (value: boolean) => (
                value ? (
                    <Badge variant="secondary">Eliminada</Badge>
                ) : (
                    <Badge variant="default">Activa</Badge>
                )
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            key: 'name',
            name: 'name' as keyof LocationInput,
            label: 'Nombre de la Ubicación',
            type: 'text' as const,
            required: true,
            placeholder: 'Ej: Biblioteca Sudestada, Club CARM, etc.',
            icon: Building2
        },
        {
            key: 'address',
            name: 'address' as keyof LocationInput,
            label: 'Dirección',
            type: 'text' as const,
            required: false,
            placeholder: 'Dirección completa del lugar',
            icon: MapPin
        },
        {
            key: 'city',
            name: 'city' as keyof LocationInput,
            label: 'Ciudad',
            type: 'text' as const,
            required: false,
            placeholder: 'Ciudad donde se encuentra',
            icon: MapPin
        },
        {
            key: 'country',
            name: 'country' as keyof LocationInput,
            label: 'País',
            type: 'text' as const,
            required: false,
            placeholder: 'País donde se encuentra',
            icon: Globe
        }
    ];

    const formTitle = abm.editingItem
        ? `Editar Ubicación: ${abm.editingItem.name}`
        : 'Nueva Ubicación';

    return (
        <UnifiedABMLayout
            title="Gestión de Ubicaciones"
            description="Administra las ubicaciones donde se realizan torneos y juegos de mahjong"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={formTitle}

            // Configuración del grid
            data={abm.data}
            columns={columns}
            actions={[]}
            loading={abm.loading}

            // Configuración del formulario
            formFields={formFields}
            formErrors={abm.formErrors}
            formSuccess={abm.formSuccess}
            successMessage="Ubicación guardada correctamente"

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar ubicaciones..."
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
            emptyMessage="No hay ubicaciones registradas"
        />
    );
}
