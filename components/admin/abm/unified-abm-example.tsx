"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import {
    ConfirmationModal,
    FormModal,
    UnifiedBadge,
    UnifiedButton,
    UnifiedCard,
    UnifiedCardContent,
    UnifiedCardDescription,
    UnifiedCardHeader,
    UnifiedCardTitle,
    UnifiedFieldGroup,
    UnifiedInput,
    UnifiedSelect,
    commonPatterns
} from "@/components/ui/unified";
import { PlayerWithStats } from "@/lib/model";
import { cn } from "@/lib/utils";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import React, { useState } from "react";

interface UnifiedABMExampleProps {
    title: string;
    description?: string;
    data: PlayerWithStats[];
    loading?: boolean;
    onAdd?: () => void;
    onEdit?: (item: PlayerWithStats) => void;
    onDelete?: (item: PlayerWithStats) => void;
}

export function UnifiedABMExample({
    title,
    description,
    data,
    loading = false,
    onAdd,
    onEdit,
    onDelete
}: UnifiedABMExampleProps) {
    const { t } = useI18nContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<PlayerWithStats | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: PlayerWithStats | null }>({
        isOpen: false,
        item: null
    });

    // Filtrar datos
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item =>
            item.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const handleEdit = (item: PlayerWithStats) => {
        setEditingItem(item);
        setShowForm(true);
        onEdit?.(item);
    };

    const handleDelete = (item: PlayerWithStats) => {
        setDeleteConfirm({ isOpen: true, item });
    };

    const confirmDelete = () => {
        if (deleteConfirm.item) {
            onDelete?.(deleteConfirm.item);
        }
        setDeleteConfirm({ isOpen: false, item: null });
    };

    const handleFormSubmit = () => {
        // Lógica de envío del formulario
        setShowForm(false);
        setEditingItem(null);
    };

    return (
        <div className={commonPatterns.container.page}>
            {/* Header principal */}
            <UnifiedCard variant="gradient" className="mb-6">
                <UnifiedCardHeader
                    icon={Users}
                    actions={
                        onAdd && (
                            <UnifiedButton
                                variant="primary"
                                onClick={() => {
                                    setEditingItem(null);
                                    setShowForm(true);
                                    onAdd();
                                }}
                                icon={Plus}
                            >
                                Agregar {title.slice(0, -1)}
                            </UnifiedButton>
                        )
                    }
                >
                    <UnifiedCardTitle>{title}</UnifiedCardTitle>
                    {description && (
                        <UnifiedCardDescription>{description}</UnifiedCardDescription>
                    )}
                </UnifiedCardHeader>
            </UnifiedCard>

            {/* Filtros */}
            <UnifiedCard className="mb-6">
                <UnifiedCardContent className="pt-6">
                    <UnifiedFieldGroup columns={3}>
                        <UnifiedInput
                            label="Buscar"
                            placeholder="Buscar por nombre o nickname..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Users}
                            fullWidth
                        />

                        <UnifiedSelect
                            label="País"
                            placeholder="Todos los países"
                            options={[
                                { value: "", label: "Todos los países" },
                                { value: "ARG", label: "Argentina" },
                                { value: "CHL", label: "Chile" },
                                { value: "URY", label: "Uruguay" }
                            ]}
                            fullWidth
                        />

                        <UnifiedSelect
                            label="Estado"
                            placeholder="Todos los estados"
                            options={[
                                { value: "", label: "Todos los estados" },
                                { value: "active", label: "Activos" },
                                { value: "inactive", label: "Inactivos" }
                            ]}
                            fullWidth
                        />
                    </UnifiedFieldGroup>
                </UnifiedCardContent>
            </UnifiedCard>

            {/* Lista de datos */}
            <UnifiedCard variant="elevated">
                <UnifiedCardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center space-y-3">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
                            </div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No hay datos disponibles
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm ? "No se encontraron resultados para tu búsqueda." : "Aún no hay elementos creados."}
                            </p>
                        </div>
                    ) : (
                        <div className={cn(commonPatterns.gridResponsive[3], "gap-4")}>
                            {filteredData.map((item) => (
                                <UnifiedCard
                                    key={item.id}
                                    variant="bordered"
                                    hover
                                    className="transition-all duration-200"
                                >
                                    <UnifiedCardContent className="pt-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {item.nickname.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {item.nickname}
                                                    </h3>
                                                    {item.fullname && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {item.fullname}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {onEdit && (
                                                    <UnifiedButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                        icon={Edit}
                                                        className="h-8 w-8 p-0"
                                                    />
                                                )}
                                                {onDelete && (
                                                    <UnifiedButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item)}
                                                        icon={Trash2}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Juegos:</span>
                                                <UnifiedBadge variant="info" size="sm">
                                                    {item.totalGames}
                                                </UnifiedBadge>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Win Rate:</span>
                                                <UnifiedBadge
                                                    variant={item.winRate >= 25 ? "success" : item.winRate >= 20 ? "warning" : "danger"}
                                                    size="sm"
                                                >
                                                    {item.winRate.toFixed(1)}%
                                                </UnifiedBadge>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Pos. Promedio:</span>
                                                <UnifiedBadge
                                                    variant={item.avgPosition < 2.5 ? "success" : item.avgPosition <= 2.6 ? "warning" : "danger"}
                                                    size="sm"
                                                >
                                                    {item.avgPosition.toFixed(2)}
                                                </UnifiedBadge>
                                            </div>

                                            <UnifiedBadge variant="success" size="sm" className="w-full justify-center">
                                                Activo
                                            </UnifiedBadge>
                                        </div>
                                    </UnifiedCardContent>
                                </UnifiedCard>
                            ))}
                        </div>
                    )}
                </UnifiedCardContent>
            </UnifiedCard>

            {/* Modal de formulario */}
            <FormModal
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingItem(null);
                }}
                onSubmit={handleFormSubmit}
                title={editingItem ? "Editar Elemento" : "Nuevo Elemento"}
                description="Completa los campos para guardar los cambios"
                icon={editingItem ? Edit : Plus}
            >
                <UnifiedFieldGroup columns={2} className={commonPatterns.spacing.form}>
                    <UnifiedInput
                        label="Nickname *"
                        placeholder="Ingresa el nickname"
                        defaultValue={editingItem?.nickname}
                        fullWidth
                    />

                    <UnifiedInput
                        label="Nombre Completo"
                        placeholder="Ingresa el nombre completo"
                        defaultValue={editingItem?.fullname}
                        fullWidth
                    />

                    <UnifiedSelect
                        label="País"
                        placeholder="Selecciona un país"
                        options={[
                            { value: "ARG", label: "Argentina" },
                            { value: "CHL", label: "Chile" },
                            { value: "URY", label: "Uruguay" }
                        ]}
                        fullWidth
                    />

                    <UnifiedInput
                        label="Fecha de Nacimiento"
                        type="date"
                        fullWidth
                    />
                </UnifiedFieldGroup>
            </FormModal>

            {/* Modal de confirmación */}
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={`¿Estás seguro de que deseas eliminar a "${deleteConfirm.item?.nickname}"? Esta acción no se puede deshacer.`}
                variant="danger"
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
}
