'use client';

import { FormField } from '@/components/admin/abm/generic-form';
import { GridAction, GridColumn } from '@/components/admin/abm/generic-grid-responsive';
import { useI18nContext } from '@/components/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { useCrud } from '@/hooks/use-crud';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
const UnifiedABMLayout = dynamic(() => import('@/components/admin/abm/unified-abm-layout').then(m => m.UnifiedABMLayout));

interface DanConfig {
    id: number;
    rank: string;
    sanma: boolean;
    minPoints: number;
    maxPoints: number;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
    isProtected: boolean;
    color: string;
    cssClass: string;
    isLastRank: boolean;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function DanConfigsPage() {
    const { t } = useI18nContext();
    const abm = useCrud<DanConfig>({ resource: 'dan-configs' });


    // Configuración de columnas del grid
    const columns: GridColumn[] = useMemo(() => [
        {
            key: 'id',
            label: t('admin.configFields.id'),
            sortable: true,
            type: 'number',
            width: '80px'
        },
        {
            key: 'rank',
            label: t('admin.configFields.rank'),
            sortable: true,
            type: 'text',
            width: '150px'
        },
        {
            key: 'sanma',
            label: t('admin.configLabels.sanma'),
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
            key: 'minPoints',
            label: 'Min Puntos',
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'maxPoints',
            label: 'Max Puntos',
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'firstPlace',
            label: '1er Lugar',
            sortable: true,
            type: 'number',
            width: '90px'
        },
        {
            key: 'secondPlace',
            label: '2do Lugar',
            sortable: true,
            type: 'number',
            width: '90px'
        },
        {
            key: 'thirdPlace',
            label: '3er Lugar',
            sortable: true,
            type: 'number',
            width: '90px'
        },
        {
            key: 'fourthPlace',
            label: '4to Lugar',
            sortable: true,
            type: 'number',
            width: '90px',
            render: (value: number | null) => value !== null && value !== undefined ? value : '-'
        },
        {
            key: 'isProtected',
            label: 'Protegido',
            sortable: true,
            type: 'boolean',
            width: '100px',
            render: (value: boolean) => (
                <Badge variant={value ? 'default' : 'outline'}>
                    {value ? 'Sí' : 'No'}
                </Badge>
            )
        },
        {
            key: 'color',
            label: 'Color',
            sortable: true,
            type: 'text',
            width: '100px',
            render: (value: string) => (
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: value }}
                    />
                    <span className="text-xs">{value}</span>
                </div>
            )
        },
        {
            key: 'isLastRank',
            label: 'Último',
            sortable: true,
            type: 'boolean',
            width: '80px',
            render: (value: boolean) => (
                <Badge variant={value ? 'destructive' : 'outline'}>
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
    ], [t]);

    // Configuración de campos del formulario
    const formFields: FormField[] = useMemo(() => [
        { key: 'id', label: 'ID', type: 'hidden', required: false },
        { key: 'rank', label: 'Rango', type: 'text', required: true },
        { key: 'sanma', label: 'Sanma (3 jugadores)', type: 'boolean', required: true },
        { key: 'minPoints', label: 'Puntos Mínimos Yonma', type: 'number', required: true },
        { key: 'maxPoints', label: 'Puntos Máximos Yonma', type: 'number', required: true },
        { key: 'firstPlace', label: '1er Lugar', type: 'number', required: true },
        { key: 'secondPlace', label: '2do Lugar', type: 'number', required: true },
        { key: 'thirdPlace', label: '3er Lugar', type: 'number', required: true },
        { key: 'fourthPlace', label: '4to Lugar', type: 'number', required: false },
        { key: 'isProtected', label: 'Rango Protegido', type: 'boolean', required: true },
        { key: 'color', label: 'Color', type: 'color', required: true },
        { key: 'cssClass', label: 'Clase CSS', type: 'text', required: true },
        { key: 'isLastRank', label: 'Último Rango', type: 'boolean', required: true },
    ], []);

    // Configuración de acciones del grid
    const actions: GridAction[] = useMemo(() => [], []);

    return (
        <UnifiedABMLayout
            title="Configuraciones DAN"
            description="Gestiona las configuraciones de rangos DAN del sistema"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={abm.editingItem ?
                'Editar Configuración DAN' :
                'Nueva Configuración DAN'
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
            successMessage="Configuración DAN guardada correctamente"

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar configuraciones DAN..."
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
            emptyMessage="No hay configuraciones DAN registradas"
        />
    );
}