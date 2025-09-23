import { useCallback, useEffect, useState } from "react";

interface UseUnifiedABMProps<T> {
    initialData?: T[];
    loadFunction: (showDeleted?: boolean) => Promise<{ data: T[] }>;
    createFunction: (data: Partial<T>) => Promise<any>;
    updateFunction: (id: number | string, data: Partial<T>) => Promise<any>;
    deleteFunction?: (id: number | string) => Promise<any>;
    restoreFunction?: (id: number | string) => Promise<any>;
}

interface UseUnifiedABMReturn<T> {
    // Estado
    data: T[];
    setData: (data: T[]) => void;
    showForm: boolean;
    setShowForm: (show: boolean) => void;
    editingItem: T | null;
    setEditingItem: (item: T | null) => void;
    showDeleted: boolean;
    setShowDeleted: (show: boolean) => void;
    loading: boolean;
    formErrors: Record<string, string>;
    setFormErrors: (errors: Record<string, string>) => void;
    formSuccess: boolean;
    setFormSuccess: (success: boolean) => void;

    // Acciones
    handleAdd: () => void;
    handleEdit: (item: T) => void;
    handleDelete: (item: T) => Promise<void>;
    handleRestore: (item: T) => Promise<void>;
    handleFormSubmit: (formData: any) => Promise<void>;
    handleFormCancel: () => void;
    handleRefresh: () => Promise<void>;
    handleToggleShowDeleted: () => void;

    // Utilidades
    resetForm: () => void;
    loadData: () => Promise<void>;
}

export function useUnifiedABM<T extends { id: number | string }>({
    initialData = [],
    loadFunction,
    createFunction,
    updateFunction,
    deleteFunction,
    restoreFunction
}: UseUnifiedABMProps<T>): UseUnifiedABMReturn<T> {

    // Estado
    const [data, setData] = useState<T[]>(initialData);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [showDeleted, setShowDeleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formSuccess, setFormSuccess] = useState(false);

    // Cargar datos - función estable que no se recrea innecesariamente
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await loadFunction(showDeleted);
            setData(result.data || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    }, [loadFunction, showDeleted]);

    // Resetear formulario
    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormErrors({});
        setFormSuccess(false);
    };

    // Handlers
    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setFormErrors({});
        setFormSuccess(false);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((item: T) => {
        setEditingItem(item);
        setFormErrors({});
        setFormSuccess(false);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (item: T) => {
        if (!deleteFunction) return;

        try {
            setLoading(true);
            await deleteFunction(item.id);
            await loadData(); // Recargar datos
        } catch (error) {
            console.error('Error eliminando elemento:', error);
        } finally {
            setLoading(false);
        }
    }, [deleteFunction, loadData]);

    const handleRestore = useCallback(async (item: T) => {
        if (!restoreFunction) return;

        try {
            setLoading(true);
            await restoreFunction(item.id);
            await loadData(); // Recargar datos
        } catch (error) {
            console.error('Error restaurando elemento:', error);
        } finally {
            setLoading(false);
        }
    }, [restoreFunction, loadData]);

    const handleFormSubmit = useCallback(async (formData: any) => {
        try {
            setFormErrors({});
            setLoading(true);

            if (editingItem) {
                // Actualizar
                await updateFunction(editingItem.id, formData);
            } else {
                // Crear
                await createFunction(formData);
            }

            setFormSuccess(true);

            // Recargar datos y cerrar formulario después de un delay
            await loadData();
            setTimeout(() => {
                resetForm();
            }, 1500);

        } catch (error: any) {
            console.error('Error en formulario:', error);

            // Manejar errores de validación
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                setFormErrors({
                    general: error.message || 'Error desconocido'
                });
            }
        } finally {
            setLoading(false);
        }
    }, [editingItem, updateFunction, createFunction, loadData]);

    const handleFormCancel = useCallback(() => {
        resetForm();
    }, []);

    const handleRefresh = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const handleToggleShowDeleted = useCallback(() => {
        setShowDeleted(!showDeleted);
    }, [showDeleted]);

    // Cargar datos inicialmente y cuando cambie showDeleted
    // Usar dependencias específicas en lugar de loadData para evitar loops
    useEffect(() => {
        loadData();
    }, [loadFunction, showDeleted]);

    return {
        // Estado
        data,
        setData,
        showForm,
        setShowForm,
        editingItem,
        setEditingItem,
        showDeleted,
        setShowDeleted,
        loading,
        formErrors,
        setFormErrors,
        formSuccess,
        setFormSuccess,

        // Acciones
        handleAdd,
        handleEdit,
        handleDelete,
        handleRestore,
        handleFormSubmit,
        handleFormCancel,
        handleRefresh,
        handleToggleShowDeleted,

        // Utilidades
        resetForm,
        loadData
    };
}

export default useUnifiedABM;
