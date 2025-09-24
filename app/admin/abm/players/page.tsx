"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Users } from "@/components/ui/icons";
import { usePlayersOperationsUnified } from "@/hooks/use-players-operations-unified";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

    // Hook de operaciones
    const { loading, load, create, update, remove, restore, loadCountries } =
        usePlayersOperationsUnified();

    // ==== Callbacks estables que le pasamos al ABM ====
    const loadFn = useCallback(
        async (showDeleted?: boolean) => {
            const result = await load(showDeleted);
            return { data: (result as any)?.data ?? [] };
        },
        [load]
    );
    const createFn = useCallback((data: Partial<Player>) => create(data), [create]);
    const updateFn = useCallback(
        (id: number | string, data: Partial<Player>) => update(Number(id), data),
        [update]
    );
    const deleteFn = useCallback((id: number | string) => remove(Number(id)), [remove]);
    const restoreFn = useCallback((id: number | string) => restore(Number(id)), [restore]);

    // Hook unificado
    const abm = useUnifiedABM<Player>({
        loadFunction: loadFn,
        createFunction: createFn,
        updateFunction: updateFn,
        deleteFunction: deleteFn,
        restoreFunction: restoreFn,
    });

    // ==== Cargar países SOLO UNA VEZ ====
    const didLoadCountries = useRef(false);
    useEffect(() => {
        if (didLoadCountries.current) return;
        didLoadCountries.current = true; // guard idempotente

        (async () => {
            try {
                const countriesData = await loadCountries();
                setCountries(countriesData);
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
            },
            { key: "playerNumber", label: "Legajo", type: "number", required: true },
            { key: "birthday", label: "Fecha de Nacimiento", type: "date", required: false },
        ],
        [countries]
    );

    const actions: GridAction[] = useMemo(
        () => [
            {
                key: "view",
                label: "Ver Perfil",
                icon: Users,
                variant: "outline",
                onClick: (row: Player) => router.push(`/player/${row.playerNumber}`),
            },
            {
                key: "edit",
                label: "Editar",
                icon: Edit,
                variant: "outline",
                onClick: (row: Player) => abm.handleEdit(row),
                show: (row: Player) => !row.deleted,
            },
            {
                key: "delete",
                label: "Eliminar",
                icon: Trash2,
                variant: "destructive",
                onClick: (row: Player) => {
                    if (confirm(`¿Estás seguro de que quieres eliminar al jugador "${row.nickname}"?`)) {
                        abm.handleDelete(row);
                    }
                },
                show: (row: Player) => !row.deleted,
            },
            {
                key: "restore",
                label: "Restaurar",
                icon: Eye,
                variant: "outline",
                onClick: (row: Player) => abm.handleRestore(row),
                show: (row: Player) => row.deleted,
            },
        ],
        [router, abm]
    );

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
            loading={abm.loading || loading}
            formFields={formFields}
            formErrors={abm.formErrors}
            formSuccess={abm.formSuccess}
            successMessage="Jugador guardado correctamente"
            searchPlaceholder="Buscar jugadores..."
            showDeleted={abm.showDeleted}
            onToggleShowDeleted={abm.handleToggleShowDeleted}
            onAdd={abm.handleAdd}
            onRefresh={abm.handleRefresh}
            onFormSubmit={abm.handleFormSubmit}
            onFormCancel={abm.handleFormCancel}
            emptyMessage="No hay jugadores registrados"
        />
    );
}
