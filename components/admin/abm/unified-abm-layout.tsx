"use client";

import { ReactNode } from "react";
import styles from "./abm-styles.module.css";
import { FormField, GenericForm } from "./generic-form";
import { GenericGridResponsive as GenericGrid, GridAction, GridColumn } from "./generic-grid-responsive";

interface UnifiedABMLayoutProps<T = any> {
    // Configuración general
    title: string;
    description: string;

    // Estado del formulario
    showForm: boolean;
    editingItem: T | null;
    formTitle?: string;

    // Configuración del grid
    data: T[];
    columns: GridColumn[];
    actions?: GridAction[];
    loading?: boolean;

    // Configuración del formulario
    formFields: FormField[];
    formErrors?: Record<string, string>;
    formSuccess?: boolean;
    successMessage?: string;

    // Configuración de búsqueda y filtros
    searchable?: boolean;
    searchPlaceholder?: string;
    showDeleted?: boolean;
    onToggleShowDeleted?: () => void;

    // Callbacks
    onAdd: () => void;
    onRefresh: () => void;
    onFormSubmit: (data: any) => Promise<void>;
    onFormCancel: () => void;

    // Mensajes personalizados
    emptyMessage?: string;

    // Contenido adicional (para casos especiales como sub-ABMs)
    additionalFormContent?: ReactNode;
}

export function UnifiedABMLayout<T = any>({
    title,
    description,
    showForm,
    editingItem,
    formTitle,
    data,
    columns,
    actions,
    loading = false,
    formFields,
    formErrors = {},
    formSuccess = false,
    successMessage = "Elemento guardado correctamente",
    searchable = true,
    searchPlaceholder,
    showDeleted = false,
    onToggleShowDeleted,
    onAdd,
    onRefresh,
    onFormSubmit,
    onFormCancel,
    emptyMessage,
    additionalFormContent
}: UnifiedABMLayoutProps<T>) {

    const defaultSearchPlaceholder = searchPlaceholder || `Buscar ${title.toLowerCase()}...`;
    const defaultEmptyMessage = emptyMessage || `No hay ${title.toLowerCase()} registrados`;
    const defaultFormTitle = formTitle || (editingItem ? `Editar ${title.slice(0, -1)}` : `Nuevo ${title.slice(0, -1)}`);

    return (
        <div className={styles.abmContainer}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            </div>

            {/* Contenido principal: Form O Grid (nunca ambos) */}
            {showForm ? (
                <div className={`${styles.formContainer} space-y-6`}>
                    <GenericForm
                        title={defaultFormTitle}
                        fields={formFields}
                        initialData={editingItem || {}}
                        onSubmit={onFormSubmit}
                        onCancel={onFormCancel}
                        errors={formErrors}
                        success={formSuccess}
                        successMessage={successMessage}
                    />

                    {/* Contenido adicional del formulario (para sub-ABMs, etc.) */}
                    {additionalFormContent}
                </div>
            ) : (
                <GenericGrid
                    title={title}
                    columns={columns}
                    actions={actions}
                    data={data}
                    loading={loading}
                    onRefresh={onRefresh}
                    onAdd={onAdd}
                    searchable={searchable}
                    searchPlaceholder={defaultSearchPlaceholder}
                    showDeleted={showDeleted}
                    onToggleShowDeleted={onToggleShowDeleted}
                    emptyMessage={defaultEmptyMessage}
                />
            )}
        </div>
    );
}

export default UnifiedABMLayout;
