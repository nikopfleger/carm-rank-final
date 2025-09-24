'use client';

import { FormField } from '@/components/admin/abm/generic-form';
import { GridAction, GridColumn } from '@/components/admin/abm/generic-grid-responsive';
import { useI18nContext } from '@/components/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { useCrud } from '@/hooks/use-crud';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
const UnifiedABMLayout = dynamic(() => import('@/components/admin/abm/unified-abm-layout').then(m => m.UnifiedABMLayout));

interface RateConfig {
    id: number;
    name: string;
    sanma: boolean;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    fourthPlace: number | null;
    adjustmentRate: number;
    adjustmentLimit: number;
    minAdjustment: number;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function RateConfigsPage() {
    const { t } = useI18nContext();

    const abm = useCrud<RateConfig>({ resource: 'rate-configs' });


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
            key: 'name',
            label: t('admin.configFields.name'),
            sortable: true,
            type: 'text'
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
            key: 'firstPlace',
            label: t('admin.configFields.firstPlace'),
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'secondPlace',
            label: t('admin.configFields.secondPlace'),
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'thirdPlace',
            label: t('admin.configFields.thirdPlace'),
            sortable: true,
            type: 'number',
            width: '100px'
        },
        {
            key: 'fourthPlace',
            label: t('admin.configFields.fourthPlace'),
            sortable: true,
            type: 'number',
            width: '100px',
            render: (value: number | null) => value !== null && value !== undefined ? value : '-'
        },
        {
            key: 'adjustmentRate',
            label: t('admin.configFields.adjustmentRate'),
            sortable: true,
            type: 'number',
            width: '120px',
            render: (value: number) => typeof value === 'number' ? value.toFixed(4) : value
        },
        {
            key: 'adjustmentLimit',
            label: t('admin.configFields.adjustmentLimit'),
            sortable: true,
            type: 'number',
            width: '120px'
        },
        {
            key: 'minAdjustment',
            label: t('admin.configFields.minAdjustment'),
            sortable: true,
            type: 'number',
            width: '120px',
            render: (value: number) => typeof value === 'number' ? value.toFixed(4) : value
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
        { key: 'id', label: t('admin.configFields.id'), type: 'hidden', required: false },
        { key: 'name', label: t('admin.configFields.name'), type: 'text', required: true },
        { key: 'sanma', label: t('admin.configFields.sanma'), type: 'boolean', required: true },
        { key: 'firstPlace', label: t('admin.configFields.firstPlace'), type: 'number', required: true },
        { key: 'secondPlace', label: t('admin.configFields.secondPlace'), type: 'number', required: true },
        { key: 'thirdPlace', label: t('admin.configFields.thirdPlace'), type: 'number', required: true },
        { key: 'fourthPlace', label: t('admin.configFields.fourthPlace'), type: 'number', required: false },
        { key: 'adjustmentRate', label: t('admin.configFields.adjustmentRate'), type: 'number', required: true },
        { key: 'adjustmentLimit', label: t('admin.configFields.adjustmentLimit'), type: 'number', required: true },
        { key: 'minAdjustment', label: t('admin.configFields.minAdjustment'), type: 'number', required: true },
    ], [t]);

    // Configuración de acciones del grid
    const actions: GridAction[] = useMemo(() => [], []);

    return (
        <UnifiedABMLayout
            title={t('admin.rateConfigs')}
            description="Gestiona las configuraciones de puntuación RATE del sistema"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={abm.editingItem ?
                t('admin.configLabels.editConfig') + ' RATE' :
                t('admin.configLabels.newConfig') + ' RATE'
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
            successMessage="Configuración RATE guardada correctamente"

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar configuraciones RATE..."
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
            emptyMessage="No hay configuraciones RATE registradas"
        />
    );
}
