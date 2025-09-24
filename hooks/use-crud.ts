"use client";
import { useAbmService } from '@/components/providers/services-provider';
import { useCallback, useEffect, useState } from 'react';

type CrudOptions<T> = {
    resource: string;
    initialShowDeleted?: boolean;
    mapToCreateAction?: (data: any) => any;
    mapToUpdateAction?: (data: any) => any;
};

export function useCrud<T = any>(opts: CrudOptions<T>) {
    const abm = useAbmService();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [showDeleted, setShowDeleted] = useState(!!opts.initialShowDeleted);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formSuccess, setFormSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            console.debug('[ABM][FE] list resource=%s showDeleted=%s', opts.resource, showDeleted);
            const rows = await (abm as any).list(opts.resource, { includeDeleted: showDeleted });
            setData(Array.isArray(rows) ? rows : (rows?.data ?? []));
            console.debug('[ABM][FE] list resource=%s got=%d', opts.resource, Array.isArray(rows) ? rows.length : (rows?.data?.length ?? -1));
        } finally {
            setLoading(false);
        }
    }, [abm, opts.resource, showDeleted]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setShowForm(true);
        setFormErrors({});
        setFormSuccess(false);
    }, []);

    const handleEdit = useCallback((row: any) => {
        setEditingItem(row);
        setShowForm(true);
        setFormErrors({});
        setFormSuccess(false);
    }, []);

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingItem(null);
    }, []);

    const handleToggleShowDeleted = useCallback(() => setShowDeleted(v => !v), []);
    const handleRefresh = useCallback(() => load(), [load]);

    const handleDelete = useCallback(async (row: any) => {
        await (abm as any).remove(opts.resource, row.id);
        await load();
    }, [abm, opts.resource, load]);

    const handleRestore = useCallback(async (row: any) => {
        await (abm as any).restore(opts.resource, row.id);
        await load();
    }, [abm, opts.resource, load]);

    const handleFormSubmit = useCallback(async (formData: any) => {
        setFormErrors({});
        setFormSuccess(false);
        try {
            if (editingItem) {
                const payload = opts.mapToUpdateAction ? opts.mapToUpdateAction(formData) : formData;
                await (abm as any).update(opts.resource, (editingItem as any).id, payload);
            } else {
                const payload = opts.mapToCreateAction ? opts.mapToCreateAction(formData) : formData;
                await (abm as any).create(opts.resource, payload);
            }
            setFormSuccess(true);
            setShowForm(false);
            setEditingItem(null);
            await load();
        } catch (e: any) {
            setFormErrors(e?.errors || { _error: e?.message || 'Error' });
        }
    }, [abm, opts, editingItem, load]);

    return {
        data, loading,
        showForm, editingItem, formErrors, formSuccess,
        showDeleted,
        handleAdd, handleEdit, handleCancel, handleFormSubmit,
        handleDelete, handleRestore, handleToggleShowDeleted, handleRefresh,
    };
}


