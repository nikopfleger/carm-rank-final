"use client";

import { FormField } from "@/components/admin/abm/generic-form";
import { GridAction, GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Users } from "@/components/ui/icons";
import { usePlayersOperationsUnified } from "@/hooks/use-players-operations-unified";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const UnifiedABMLayout = dynamic(() => import("@/components/admin/abm/unified-abm-layout").then(m => m.UnifiedABMLayout));

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

    // Usar el hook personalizado para operaciones ABM
    const { loading, load, create, update, remove, restore, loadCountries } = usePlayersOperationsUnified();

    // Usar el hook unificado de ABM
    const abm = useUnifiedABM<Player>({
        loadFunction: async (showDeleted?: boolean) => {
            const result = await load(showDeleted);
            return result;
        },
        createFunction: create,
        updateFunction: (id: number | string, data: Partial<Player>) => update(Number(id), data),
        deleteFunction: (id: number | string) => remove(Number(id)),
        restoreFunction: (id: number | string) => restore(Number(id))
    });

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const countriesData = await loadCountries();
                setCountries(countriesData);
                await abm.loadData();
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        loadInitialData();
    }, [abm, loadCountries, abm.showDeleted]);

    // Configuración de columnas del grid
    const columns: GridColumn[] = [
        {
            key: "id",
            label: "ID",
            width: "80px",
            sortable: true,
            type: "number"
        },
        {
            key: "nickname",
            label: "Nickname",
            width: "150px",
            sortable: true,
            type: "text"
        },
        {
            key: "fullname",
            label: "Nombre",
            width: "200px",
            sortable: true,
            type: "text",
            render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
        },
        {
            key: "playerNumber",
            label: "Legajo",
            width: "100px",
            sortable: true,
            type: "number"
        },
        {
            key: "country.fullName",
            label: "País",
            width: "150px",
            sortable: true,
            type: "text",
            render: (value: string | undefined) => value !== undefined && value !== null ? value : '-'
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
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields: FormField[] = [
        { key: "nickname", label: "Nickname", type: "text", required: true },
        { key: "fullname", label: "Nombre Completo", type: "text", required: false },
        {
            key: "countryId",
            label: "País",
            type: "select",
            required: true,
            options: countries.map(c => ({ value: c.id.toString(), label: c.name_es }))
        },
        { key: "playerNumber", label: "Legajo", type: "number", required: true },
        { key: "birthday", label: "Fecha de Nacimiento", type: "date", required: false }
    ];

    // Configuración de acciones del grid
    const actions: GridAction[] = [
        {
            key: "view",
            label: "Ver Perfil",
            icon: Users,
            variant: "outline",
            onClick: (row: Player) => {
                router.push(`/player/${row.playerNumber}`);
            },
            show: () => true
        },
        {
            key: "edit",
            label: "Editar",
            icon: Edit,
            variant: "outline",
            onClick: (row: Player) => abm.handleEdit(row),
            show: (row: Player) => !row.deleted
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
            show: (row: Player) => !row.deleted
        },
        {
            key: "restore",
            label: "Restaurar",
            icon: Eye,
            variant: "outline",
            onClick: (row: Player) => abm.handleRestore(row),
            show: (row: Player) => row.deleted
        }
    ];

    return (
        <UnifiedABMLayout
            title="Gestión de Jugadores"
            description="Administra los jugadores registrados en el sistema"

            // Estado del formulario
            showForm={abm.showForm}
            editingItem={abm.editingItem}
            formTitle={abm.editingItem ?
                `Editar Jugador: ${abm.editingItem.nickname}` :
                "Nuevo Jugador"
            }

            // Configuración del grid
            data={abm.data}
            columns={columns}
            actions={actions}
            loading={abm.loading || loading}

            // Configuración del formulario
            formFields={formFields}
            formErrors={abm.formErrors}
            formSuccess={abm.formSuccess}
            successMessage="Jugador guardado correctamente"

            // Configuración de búsqueda y filtros
            searchPlaceholder="Buscar jugadores..."
            showDeleted={abm.showDeleted}
            onToggleShowDeleted={abm.handleToggleShowDeleted}

            // Callbacks
            onAdd={abm.handleAdd}
            onRefresh={abm.handleRefresh}
            onFormSubmit={abm.handleFormSubmit}
            onFormCancel={abm.handleFormCancel}

            // Mensajes personalizados
            emptyMessage="No hay jugadores registrados"
        />
    );
}
