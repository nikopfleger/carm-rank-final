"use client";

import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Archive, Building2, Edit, Globe, MapPin, RotateCcw, Trash2 } from "@/components/ui/icons";
import { useErrorHandler } from "@/hooks/use-error-handler";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
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
    const { handleError, handleSuccess } = useErrorHandler();

    // Estado
    const [data, setData] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Location | null>(null);
    const [formData, setFormData] = useState<LocationInput>({
        name: '',
        address: '',
        city: '',
        country: '',
        extraData: null
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formSuccess, setFormSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    // Cargar datos
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (showDeleted) params.append('includeDeleted', 'true');

            const response = await fetch(`/api/abm/locations?${params}`);
            if (response.ok) {
                const result = await response.json();
                const locations = result.data || result; // Soportar ambos formatos
                setData(locations);
            } else {
                throw new Error('Error cargando ubicaciones');
            }
        } catch (error) {
            handleError(error, 'Cargar ubicaciones');
        } finally {
            setLoading(false);
        }
    }, [showDeleted, handleError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Funciones de manejo
    const handleAdd = () => {
        setEditingItem(null);
        setFormData({ name: '', address: '', city: '', country: '', extraData: null });
        setFormErrors({});
        setFormSuccess(false);
        setShowForm(true);
    };

    const handleEdit = (item: Location) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            address: item.address || '',
            city: item.city || '',
            country: item.country || '',
            extraData: item.extraData
        });
        setFormErrors({});
        setFormSuccess(false);
        setShowForm(true);
    };

    const handleDelete = async (item: Location) => {
        if (!confirm(`¿Estás seguro de eliminar la ubicación "${item.name}"?`)) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/abm/locations/${item.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                handleSuccess('Ubicación eliminada exitosamente', 'Eliminación exitosa');
                await loadData();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error eliminando ubicación');
            }
        } catch (error) {
            handleError(error, 'Eliminar ubicación');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (item: Location) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/abm/locations/${item.id}/restore`, {
                method: 'PUT'
            });

            if (response.ok) {
                handleSuccess('Ubicación restaurada exitosamente', 'Restauración exitosa');
                await loadData();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error restaurando ubicación');
            }
        } catch (error) {
            handleError(error, 'Restaurar ubicación');
        } finally {
            setLoading(false);
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setFormErrors({});
        setFormSuccess(false);
    };

    const handleRefresh = () => {
        loadData();
    };

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
                    <Badge variant="secondary">
                        <Archive className="w-3 h-3 mr-1" />
                        Eliminada
                    </Badge>
                ) : (
                    <Badge variant="default">Activa</Badge>
                )
            )
        },
        {
            key: 'createdAt',
            label: 'Creada',
            sortable: true,
            type: 'date',
            width: '120px'
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

    const formTitle = editingItem
        ? `Editar Ubicación: ${editingItem.name}`
        : 'Nueva Ubicación';

    return (
        <UnifiedABMLayout
            title="Gestión de Ubicaciones"
            description="Administra las ubicaciones donde se realizan torneos y juegos de mahjong"

            // Estado del formulario
            showForm={showForm}
            editingItem={editingItem}
            formTitle={formTitle}

            // Configuración del grid
            data={data}
            columns={columns}
            actions={[
                {
                    key: 'edit',
                    label: 'Editar',
                    icon: Edit,
                    onClick: handleEdit,
                    variant: 'outline',
                    show: (item: Location) => !item.deleted
                },
                {
                    key: 'delete',
                    label: 'Eliminar',
                    icon: Trash2,
                    onClick: handleDelete,
                    variant: 'destructive',
                    show: (item: Location) => !item.deleted
                },
                {
                    key: 'restore',
                    label: 'Restaurar',
                    icon: RotateCcw,
                    onClick: handleRestore,
                    variant: 'outline',
                    show: (item: Location) => item.deleted
                }
            ]}
            loading={loading}

            // Configuración del formulario
            formFields={formFields}
            formErrors={formErrors}
            formSuccess={formSuccess}
            successMessage={successMessage}

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar ubicaciones..."
            showDeleted={showDeleted}
            onToggleShowDeleted={() => setShowDeleted(!showDeleted)}

            // Callbacks
            onAdd={handleAdd}
            onRefresh={handleRefresh}
            onFormSubmit={async (data) => {
                try {
                    setFormErrors({});
                    setLoading(true);

                    const url = editingItem
                        ? `/api/abm/locations/${editingItem.id}`
                        : '/api/abm/locations';

                    const method = editingItem ? 'PUT' : 'POST';

                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        handleSuccess(result.message, editingItem ? 'Actualización exitosa' : 'Creación exitosa');
                        setFormSuccess(true);

                        await loadData();
                        setTimeout(() => {
                            setShowForm(false);
                            setFormSuccess(false);
                        }, 1500);
                    } else {
                        const error = await response.json();
                        throw new Error(error.error || 'Error en el formulario');
                    }
                } catch (error) {
                    handleError(error, editingItem ? 'Actualizar ubicación' : 'Crear ubicación');
                } finally {
                    setLoading(false);
                }
            }}
            onFormCancel={handleFormCancel}

            // Mensajes personalizados
            emptyMessage="No hay ubicaciones registradas"
        />
    );
}
