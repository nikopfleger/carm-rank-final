"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { useAbmService } from "@/components/providers/services-provider";
import { Badge } from "@/components/ui/badge";
import { useCrud } from "@/hooks/use-crud";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const UnifiedABMLayout = dynamic(() =>
    import("@/components/admin/abm/unified-abm-layout").then((m) => m.UnifiedABMLayout)
);

interface Player {
    id: number;
    nickname: string;
    fullname?: string;
    countryId: number;
    playerNumber: number;
    birthday?: string;
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    country?: {
        id: number;
        fullName: string;
    };
}

interface Country {
    id: number;
    name_es: string;
    iso_code: string;
}

export default function PlayersABMPageUnified() {
    const router = useRouter();
    const [countries, setCountries] = useState<Country[]>([]);
    const abm = useCrud<Player>({ resource: 'players' });
    const abmService = useAbmService();
    const [initialFormData, setInitialFormData] = useState<any | undefined>(undefined);

    // ==== Cargar países SOLO UNA VEZ ====
    const didLoadCountries = useRef(false);
    useEffect(() => {
        if (didLoadCountries.current) return;
        didLoadCountries.current = true; // guard idempotente

        (async () => {
            try {
                const list: any = await (abmService as any).list('countries', { includeDeleted: true });
                const mapped = Array.isArray(list) ? list : (list && list.data ? list.data : []);
                setCountries(mapped.map((c: any) => ({ id: c.id, name_es: c.fullName ?? c.name_es, iso_code: c.isoCode ?? c.iso_code })));
            } catch (error) {
                console.error("Error loading countries:", error);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <-- intencionalmente vacío, para no depender de loadCountries

    // ==== Columnas, acciones y form fields memoizados ====
    const columns: GridColumn[] = useMemo(
        () => [
            { key: "id", label: "ID", width: "80px", sortable: true, type: "number" },
            { key: "nickname", label: "Nickname", width: "150px", sortable: true, type: "text" },
            {
                key: "fullname",
                label: "Nombre",
                width: "200px",
                sortable: true,
                type: "text",
                render: (value?: string) => (value ?? "-"),
            },
            { key: "playerNumber", label: "Legajo", width: "100px", sortable: true, type: "number" },
            {
                key: "country.fullName",
                label: "País",
                width: "150px",
                sortable: true,
                type: "text",
                render: (value?: string) => (value ?? "-"),
            },
            {
                key: "deleted",
                label: "Estado",
                type: "boolean",
                width: "100px",
                render: (value: boolean) => (
                    <Badge variant={value ? "destructive" : "default"}>
                        {value ? "Eliminado" : "Activo"}
                    </Badge>
                ),
            },
        ],
        []
    );

    const formFields: FormField[] = useMemo(
        () => [
            { key: "nickname", label: "Nickname", type: "text", required: true },
            { key: "fullname", label: "Nombre Completo", type: "text", required: false },
            {
                key: "countryId",
                label: "País",
                type: "select",
                required: true,
                options: countries.map((c) => ({ value: String(c.id), label: c.name_es })),
                coerceToNumber: true,
            },
            { key: "playerNumber", label: "Legajo", type: "number", required: true },
            { key: "birthday", label: "Fecha de Nacimiento", type: "date", required: false },
            // version se usa solo para optimistic locking en el update
            { key: "version", label: "version", type: "hidden" },
        ],
        [countries]
    );

    const actions: GridAction[] = useMemo(() => [], []);

    // Prefill de legajo cuando es NUEVO (no en edición)
    useEffect(() => {
        if (abm.showForm && !abm.editingItem) {
            // Fallback rápido con datos locales
            const localNext = (() => {
                const nums = (abm.data || []).map((p: any) => Number(p.playerNumber)).filter(n => !Number.isNaN(n));
                if (!nums.length) return undefined;
                return Math.max(...nums) + 1;
            })();
            if (typeof localNext === 'number') {
                setInitialFormData((prev: any) => ({ ...(prev || {}), playerNumber: localNext }));
            }

            // Valor definitivo desde el server
            (async () => {
                try {
                    const res = await fetch(`/api/abm/players/next-available?field=playerNumber`, { cache: 'no-store' });
                    const json = await res.json();
                    if (json?.success && typeof json?.value === 'number') {
                        setInitialFormData((prev: any) => ({ ...(prev || {}), playerNumber: json.value }));
                    }
                } catch { }
            })();
        }
    }, [abm.showForm, abm.editingItem, abm.data]);

    return (
        <UnifiedABMLayout
            title="Gestión de Jugadores"
            description="Administra los jugadores registrados en el sistema"
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={abm.editingItem ? `Editar Jugador: ${abm.editingItem.nickname}` : "Nuevo Jugador"}
            data={abm.data}
            columns={columns}
            actions={actions}
            loading={abm.loading}
            formFields={formFields}
            formErrors={abm.formErrors}
            formSuccess={abm.formSuccess}
            successMessage="Jugador guardado correctamente"
            searchPlaceholder="Buscar jugadores..."
            showDeleted={abm.showDeleted}
            onToggleShowDeleted={abm.handleToggleShowDeleted}
            onAdd={abm.handleAdd}
            onRefresh={abm.handleRefresh}
            onEditRow={abm.handleEdit}
            onDeleteRow={abm.handleDelete}
            onRestoreRow={abm.handleRestore}
            onFormSubmit={abm.handleFormSubmit}
            onFormCancel={abm.handleCancel}
            initialFormData={initialFormData}
            // Validación asíncrona de unicidad para legajo y nickname
            validateAsyncMap={{
                playerNumber: async (value: any, form: any) => {
                    if (value === undefined || value === null || value === '') return null;
                    try {
                        const id = abm.editingItem?.id;
                        const params = new URLSearchParams({ resource: 'players', field: 'playerNumber', value: String(value) });
                        if (id) params.append('excludeId', String(id));
                        const res = await fetch(`/api/abm/validate-unique?${params.toString()}`, { cache: 'no-store' });
                        const json = await res.json();
                        if (json?.exists) return `Legajo ${value} ya está en uso`;
                        return null;
                    } catch (e) {
                        return null;
                    }
                },
                nickname: async (value: any) => {
                    if (!value) return null;
                    try {
                        const id = abm.editingItem?.id;
                        const params = new URLSearchParams({ resource: 'players', field: 'nickname', value: String(value) });
                        if (id) params.append('excludeId', String(id));
                        const res = await fetch(`/api/abm/validate-unique?${params.toString()}`, { cache: 'no-store' });
                        const json = await res.json();
                        if (json?.exists) return `Nickname "${value}" ya está en uso`;
                        return null;
                    } catch (e) {
                        return null;
                    }
                },
            }}
            emptyMessage="No hay jugadores registrados"
        />
    );
}
