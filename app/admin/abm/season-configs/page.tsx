'use client';

import { FormField } from '@/components/admin/abm/generic-form';
import { GridAction, GridColumn } from '@/components/admin/abm/generic-grid-responsive';
import { useI18nContext } from '@/components/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { useCrud } from '@/hooks/use-crud';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
const UnifiedABMLayout = dynamic(() => import('@/components/admin/abm/unified-abm-layout').then(m => m.UnifiedABMLayout));

interface SeasonConfig {
    id: number;
    name: string;
    sanma: boolean;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
    seasonId: number | null;
    isDefault: boolean;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function SeasonConfigsPage() {
    const { t } = useI18nContext();
    const abm = useCrud<SeasonConfig>({ resource: 'season-configs' });


    // Configuración de columnas del grid
    const columns: GridColumn[] = useMemo(() => [
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
            key: 'sanma',
            label: 'Sanma',
            sortable: true,
            type: 'boolean',
            width: '100px',
            render: (value: boolean) => (
                <Badge variant={value ? 'default' : 'secondary'}>
                    {value ? 'Sanma' : 'Yonma'}
                </Badge>
            )
        },
        {
            key: 'firstPlace',
            label: '1er Lugar',
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'secondPlace',
            label: '2do Lugar',
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'thirdPlace',
            label: '3er Lugar',
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'fourthPlace',
            label: '4to Lugar',
            sortable: true,
            type: 'number',
            width: '100px',
            render: (value: number | null) => value === null ? '-' : value
        },
        {
            key: 'seasonId',
            label: 'Temporada ID',
            sortable: true,
            type: 'number',
            width: '120px',
            render: (value: number | null) => value === null ? '-' : value
        },
        {
            key: 'isDefault',
            label: 'Por Defecto',
            sortable: true,
            type: 'boolean',
            width: '120px',
            render: (value: boolean) => (
                <Badge variant={value ? 'default' : 'outline'}>
                    {value ? 'Sí' : 'No'}
                </Badge>
            )
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

    // Configuración de campos del formulario
    const formFields: FormField[] = useMemo(() => [
        { key: 'id', label: 'ID', type: 'hidden', required: false },
        { key: 'name', label: 'Nombre', type: 'text', required: true },
        { key: 'sanma', label: 'Sanma (3 jugadores)', type: 'boolean', required: true },
        { key: 'firstPlace', label: '1er Lugar', type: 'number', required: true },
        { key: 'secondPlace', label: '2do Lugar', type: 'number', required: true },
        { key: 'thirdPlace', label: '3er Lugar', type: 'number', required: true },
        { key: 'fourthPlace', label: '4to Lugar', type: 'number', required: false },
        { key: 'seasonId', label: 'Temporada ID', type: 'number', required: false },
        { key: 'isDefault', label: 'Por Defecto', type: 'boolean', required: false }
    ], []);

    // Configuración de acciones del grid
    const actions: GridAction[] = useMemo(() => [], []);

    return (
        <UnifiedABMLayout
            title="Configuraciones de Temporada"
            description="Gestiona las configuraciones de puntuación por temporada"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={abm.editingItem ?
                `Editar Configuración: ${abm.editingItem.name}` :
                "Nueva Configuración de Temporada"
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
            successMessage="Configuración de temporada guardada correctamente"

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar configuraciones de temporada..."
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
            emptyMessage="No hay configuraciones de temporada registradas"
        />
    );
}