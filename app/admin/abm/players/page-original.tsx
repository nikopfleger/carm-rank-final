"use client";

import { GenericGridResponsive as GenericGrid } from "@/components/admin/abm/generic-grid-responsive";
import { PlayerFormModal } from "@/components/admin/abm/PlayerFormModal";
import { useAbmService } from "@/components/providers/services-provider";
import { Button } from "@/components/ui/button";
import { usePlayersOperations } from "@/hooks/use-abm-operations";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { hasAuthority } from "@/lib/authorization";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

interface Player {
  id: number;
  nickname: string;
  fullname?: string;
  countryId: number;
  playerNumber: number;
  birthday?: string;
  isActive: boolean;
  lastGameDate?: string;
  version: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  country?: {
    id: number;
    fullName: string;
  };
  onlineUsers?: Array<{
    id: number;
    platform: string;
    username: string;
    idOnline: string;
    isActive: boolean;
  }>;
}

interface Country {
  id: number;
  name_es: string;
  iso_code: string;
}

interface LinkRequest {
  id: number;
  user: { id: string; email: string | null; name: string | null };
  note?: string | null;
  createdAt: string;
}

// Los formFields se generan dinámicamente con los países cargados
const getFormFields = (countries: Country[]) => [
  { key: "nickname", label: "Nickname", type: "text", required: true },
  { key: "fullname", label: "Nombre Completo", type: "text" },
  {
    key: "countryId",
    label: "País",
    type: "select",
    required: true,
    options: countries.map(c => ({ value: c.id.toString(), label: c.name_es }))
  },
  { key: "playerId", label: "Legajo", type: "number", required: true },
  { key: "birthday", label: "Fecha de Nacimiento", type: "date" },
] as const;

const columns = [
  { key: "id", label: "ID", width: "80px" },
  { key: "nickname", label: "Nickname", width: "150px" },
  { key: "fullname", label: "Nombre", width: "200px" },
  { key: "playerNumber", label: "Legajo", width: "100px" },
  { key: "country.fullName", label: "País", width: "150px" },
  {
    key: "deleted",
    label: "Estado",
    width: "100px",
    render: (value: boolean) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value
        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }`}>
        {value ? 'Eliminado' : 'Activo'}
      </span>
    )
  },
];

export default function PlayersABMPage() {
  const { data: session } = useSession();
  const { handleError, handleSuccess } = useErrorHandler();
  const abmService = useAbmService();
  const [players, setPlayers] = useState<Player[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [pendingLinks, setPendingLinks] = useState<LinkRequest[]>([]);
  const [busyReqId, setBusyReqId] = useState<number | null>(null);
  const [revertSubgridFn, setRevertSubgridFn] = useState<(() => void) | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const router = useRouter();

  // Función estable para manejar revertSubgrid
  const handleRevertSubgrid = useCallback((revertFn: () => void) => {
    setRevertSubgridFn(() => revertFn);
  }, []);

  // Función para alternar visualización de inactivos
  const toggleShowInactive = () => {
    setShowInactive(!showInactive);
  };

  // Usar el hook personalizado para operaciones ABM
  const { loading, load, create, update, remove, restore } = usePlayersOperations();

  const canApprove = (() => {
    const role = session?.user?.role;
    const authorities = session?.user?.authorities || [];
    return role === "SUPER_ADMIN" || role === "ADMIN" || hasAuthority(authorities, "ABM_MANAGE");
  })();

  useEffect(() => {
    let ignore = false;
    async function loadPlayers() {
      try {
        let data;
        if (showInactive) {
          // Cargar incluyendo inactivos usando el servicio directamente
          const response = await fetch('/api/abm/players?includeDeleted=true');
          if (response.ok) {
            data = await response.json();
          } else {
            data = [];
          }
        } else {
          // Cargar solo activos usando el hook
          data = await load() as any;
        }
        if (!ignore) setPlayers(data);
      } catch (error) {
        // Error ya manejado por el hook
      }
    }
    loadPlayers();
    return () => {
      ignore = true;
    };
  }, [showInactive]);

  useEffect(() => {
    let ignore = false;
    async function loadCountries() {
      try {
        const response = await fetch('/api/common?type=countries');
        if (response.ok) {
          const data = await response.json();
          if (!ignore) setCountries(data.data || []);
        }
      } catch (error) {
        handleError(error, 'Cargar países');
      }
    }
    loadCountries();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadPending() {
      if (!editingPlayer || !canApprove) return;
      try {
        const data = await abmService.getLinkRequests({
          status: 'PENDING',
          playerId: editingPlayer.playerNumber
        }) as any;
        if (!ignore) setPendingLinks(data.requests || []);
      } catch (error) {
        handleError(error, 'Cargar solicitudes pendientes');
      }
    }
    loadPending();
    return () => {
      ignore = true;
    };
  }, [editingPlayer, canApprove]); // handleError no debe afectar la carga de solicitudes pendientes


  const handleCreate = () => {
    setEditingPlayer(null);
    setShowForm(true);
  };

  const handleEdit = (player: Player) => {
    // Mapear playerNumber a playerId para el formulario
    const playerForForm = {
      ...player,
      playerId: player.playerNumber,
      onlineUsers: player.onlineUsers || []
    };
    setEditingPlayer(playerForForm as any);
    setShowForm(true);
  };

  const handleDelete = async (player: Player) => {
    try {
      await remove(player.id);

      // Actualizar solo el objeto específico en lugar de recargar toda la lista
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === player.id
            ? { ...p, deleted: true } // Actualizar el estado local
            : p
        )
      );
    } catch (error) {
      console.error('Error eliminando jugador:', error);
      // El hook useErrorHandler se encarga de mostrar el error
    }
  };

  const handleRestore = async (player: Player) => {
    try {
      console.log('Intentando restaurar jugador:', player);
      const restoredPlayer = await restore(player.id);
      console.log('Jugador restaurado exitosamente');

      // Actualizar solo el objeto específico en lugar de recargar toda la lista
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === player.id
            ? { ...p, deleted: false } // Actualizar el estado local
            : p
        )
      );
    } catch (error) {
      console.error('Error restaurando jugador:', error);
      // El hook useErrorHandler se encarga de mostrar el error
    }
  };

  const handleFormCancel = () => {
    // Revertir cambios del subgrid si existe la función
    if (revertSubgridFn) {
      revertSubgridFn();
    }

    setShowForm(false);
    setEditingPlayer(null);
    setPendingLinks([]);
    setRevertSubgridFn(null);
  };

  const handleFormSubmit = async (data: { player: any; onlineUsers: any[] }) => {
    try {
      if (editingPlayer) {
        // Mapear playerId de vuelta a playerNumber para la API
        const playerData = {
          ...data.player,
          playerNumber: data.player.playerId
        };
        delete playerData.playerId; // Remover el campo playerId

        // Actualizar jugador existente
        await update(editingPlayer.id, playerData);

        // Actualizar cuentas online
        for (const onlineUser of data.onlineUsers) {
          if (onlineUser.pending) {
            // Crear nueva cuenta online
            await abmService.createOnlineUser({
              ...onlineUser,
              playerId: editingPlayer.id
            });
          } else if (onlineUser.id > 0) {
            // Actualizar cuenta existente
            await abmService.updateOnlineUser(onlineUser.id, onlineUser);
          }
        }

        handleSuccess('Jugador actualizado exitosamente', 'Actualización exitosa');
      } else {
        // Mapear playerId de vuelta a playerNumber para la API
        const playerData = {
          ...data.player,
          playerNumber: data.player.playerId
        };
        delete playerData.playerId; // Remover el campo playerId

        // Crear nuevo jugador
        const newPlayer = await create(playerData) as { id: number };

        // Crear cuentas online
        for (const onlineUser of data.onlineUsers) {
          await abmService.createOnlineUser({
            ...onlineUser,
            playerId: newPlayer.id
          });
        }

        handleSuccess('Jugador creado exitosamente', 'Creación exitosa');
      }

      // Recargar datos
      const updatedAtPlayers = await load();
      setPlayers(updatedAtPlayers as any);

      // Cerrar formulario
      setShowForm(false);
      setEditingPlayer(null);
      setPendingLinks([]);
    } catch (error) {
      handleError(error, editingPlayer ? 'Actualizar jugador' : 'Crear jugador');
    }
  };

  // Validación asíncrona para nickname único
  const validateNickname = async (value: string): Promise<string | null> => {
    if (!value || value.trim() === '') return null; // Dejar que la validación required se encargue

    try {
      const response = await fetch(`/api/players/check-nickname?nickname=${encodeURIComponent(value)}&excludeId=${editingPlayer?.id || ''}`);
      if (response.ok) {
        const result = await response.json();
        return result.available ? null : 'Este nickname ya está en uso';
      }
    } catch (error) {
      console.error('Error validating nickname:', error);
    }
    return null;
  };

  // Validación asíncrona para legajo único
  const validateLegajo = async (value: number): Promise<string | null> => {
    if (!value) return null; // Dejar que la validación required se encargue

    try {
      const response = await fetch(`/api/players/check-legajo?legajo=${value}&excludeId=${editingPlayer?.id || ''}`);
      if (response.ok) {
        const result = await response.json();
        return result.available ? null : 'Este legajo ya está en uso';
      }
    } catch (error) {
      console.error('Error validating legajo:', error);
    }
    return null;
  };

  async function decideRequest(id: number, action: "APPROVE" | "REJECT") {
    setBusyReqId(id);
    try {
      await abmService.updateLinkRequest(id, action);
      setPendingLinks((prev) => prev.filter((r) => r.id !== id));
      handleSuccess(
        action === "APPROVE" ? 'Solicitud aprobada exitosamente' : 'Solicitud rechazada exitosamente',
        action === "APPROVE" ? 'Aprobación exitosa' : 'Rechazo exitoso'
      );
    } catch (error) {
      handleError(error, action === "APPROVE" ? 'Aprobar solicitud' : 'Rechazar solicitud');
    } finally {
      setBusyReqId(null);
    }
  }

  return (
    <div className={styles.playersPage}>
      <div className={styles.playersHeader}>
        <div className={styles.playersTitleSection}>
          <h1 className={styles.playersTitle}>
            Administración de Jugadores
          </h1>
          <p className={styles.playersDescription}>
            Gestiona los jugadores del sistema
          </p>
        </div>
        <Button onClick={handleCreate} className={styles.playersCreateButton}>
          <Plus className="w-4 h-4" />
          Nuevo Jugador
        </Button>
      </div>

      <GenericGrid
        data={players}
        columns={columns}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        searchFields={["nickname", "fullname", "playerNumber"]}
        entityName="jugador"
        showDeleted={showInactive}
        onToggleShowDeleted={toggleShowInactive}
      />

      <PlayerFormModal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}
        initialData={editingPlayer || {}}
        countries={countries}
        onSubmit={handleFormSubmit}
        validateNickname={validateNickname}
        validateLegajo={validateLegajo}
        onRevertSubgrid={handleRevertSubgrid}
      />

      {editingPlayer && canApprove && (
        <div className="mt-6 border rounded-md p-4">
          <h3 className="font-semibold mb-2">Solicitudes de vinculación pendientes</h3>
          {pendingLinks.length === 0 ? (
            <p className="text-sm text-gray-600">No hay solicitudes pendientes.</p>
          ) : (
            <ul className="space-y-3">
              {pendingLinks.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4">
                  <div className="text-sm">
                    <div className="font-medium">{r.user.name || r.user.email || r.user.id}</div>
                    {r.note ? <div className="text-gray-600">{r.note}</div> : null}
                    <div className="text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={busyReqId === r.id} onClick={() => decideRequest(r.id, "REJECT")}>Rechazar</Button>
                    <Button disabled={busyReqId === r.id} onClick={() => decideRequest(r.id, "APPROVE")}>Aprobar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
