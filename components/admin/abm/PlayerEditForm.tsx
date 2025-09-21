"use client";

import { GenericForm } from "@/components/admin/abm/generic-form";
import { InlineSubABM } from "@/components/admin/abm/InlineSubABM";
import { ONLINE_PLATFORM_LABELS, ONLINE_PLATFORM_OPTIONS, OnlinePlatform } from "@/lib/enum/online-platform";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface OnlineUserRow { id: number; platform: string; username: string; idOnline?: string; deleted: boolean; pending?: boolean; toDelete?: boolean; }

export function PlayerEditForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [countries, setCountries] = useState<Array<{ value: any; label: string }>>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserRow[]>([]);
  const [pendingAdds, setPendingAdds] = useState<OnlineUserRow[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, Partial<OnlineUserRow>>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/abm/countries");
        if (res.ok) {
          const { data } = await res.json();
          const options = (data || []).map((c: any) => ({ value: String(c.id), label: c.fullName }));
          setCountries(options);
        }
      } catch (e) { }
    })();
  }, []);

  const loadOnlineUsers = async () => {
    const res = await fetch(`/api/abm/online-users?search=${encodeURIComponent(initialData.nickname || "")}`);
    if (res.ok) {
      const rows = await res.json();
      const mine = (rows as any[]).filter((r) => r.player?.id === initialData.id);
      setOnlineUsers(mine.map((r) => ({ id: r.id, platform: r.platform, username: r.username, idOnline: r.idOnline, deleted: r.deleted })));
      setPendingAdds([]);
      setPendingDeletes([]);
    }
  };

  useEffect(() => { loadOnlineUsers(); }, []);

  const formFields = useMemo(
    () => [
      { key: "nickname", label: "Nickname", type: "text", required: true },
      { key: "playerId", label: "Legajo", type: "number", required: true },
      { key: "fullname", label: "Nombre Completo", type: "text" },
      { key: "countryId", label: "País", type: "select", required: true, options: countries },
      { key: "birthday", label: "Fecha de Nacimiento", type: "date" },
      { key: "createdAt", label: "Creado", type: "datetime", readonly: true },
    ],
    [countries]
  );

  const validateAsyncMap = {
    nickname: async (value: any, form: any) => {
      if (!value || String(value).trim().length < 2) return null;
      const res = await fetch(`/api/abm/players?q=${encodeURIComponent(String(value))}`);
      if (!res.ok) return null;
      const rows = await res.json();
      const exists = (rows as any[]).some((p) => p.nickname === value && p.id !== initialData.id);
      return exists ? "Ya existe un jugador con ese nickname" : null;
    },
    playerId: async (value: any, form: any) => {
      if (!value) return null;
      const res = await fetch(`/api/abm/players?q=${encodeURIComponent(String(value))}`);
      if (!res.ok) return null;
      const rows = await res.json();
      const exists = (rows as any[]).some((p) => p.playerId === Number(value) && p.id !== initialData.id);
      return exists ? "Ya existe un jugador con ese legajo" : null;
    },
  } as const;

  const handleSubmit = async (data: any) => {
    const payload = {
      nickname: data.nickname,
      playerId: data.playerId ? Number(data.playerId) : undefined,
      countryId: data.countryId ? Number(data.countryId) : undefined,
      fullname: data.fullname,
      birthday: data.birthday,
    };
    const res = await fetch(`/api/abm/players/${initialData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "No se pudo guardar");
      return;
    }
    for (const add of pendingAdds) {
      const resAdd = await fetch(`/api/abm/online-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: add.platform, username: add.username, idOnline: add.idOnline, playerId: initialData.id }),
      });
      if (!resAdd.ok) {
        const e = await resAdd.json().catch(() => ({}));
        alert(e?.error || "No se pudo crear el usuario online");
        return;
      }
    }
    for (const delId of pendingDeletes) {
      await fetch(`/api/abm/online-users/${delId}`, { method: "DELETE" });
    }
    for (const [id, updates] of Object.entries(pendingUpdates)) {
      await fetch(`/api/abm/online-users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }
    router.push("/admin/abm/players");
  };

  const handleCancel = () => {
    router.push("/admin/abm/players");
  };

  const title = `Editar Jugador ${initialData.playerId} - ${initialData.nickname ?? ""}`.trim();

  const stageAddOnlineUser = (draft: Partial<OnlineUserRow>) => {
    if (!draft.platform || !draft.username) return;
    const tempId = -Date.now();
    setPendingAdds((prev) => [...prev, { id: tempId, platform: String(draft.platform), username: String(draft.username), idOnline: draft.idOnline ? String(draft.idOnline) : undefined, deleted: false, pending: true }]);
  };

  const stageDeleteOnlineUser = (id: number) => {
    const isPending = pendingAdds.some((p) => p.id === id);
    if (isPending) {
      setPendingAdds((prev) => prev.filter((p) => p.id !== id));
    } else {
      setPendingDeletes((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setOnlineUsers((prev) => prev.map((u) => (u.id === id ? { ...u, toDelete: true } : u)));
    }
  };

  const stageUpdateOnlineUser = (id: number, partial: Partial<OnlineUserRow>) => {
    setPendingUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...partial } }));
    setOnlineUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...partial } as OnlineUserRow : u)));
  };

  const platformLabel = (v?: string) => {
    return v ? ONLINE_PLATFORM_LABELS[v as OnlinePlatform] || v : '';
  };

  return (
    <div>
      <GenericForm
        title={title}
        fields={formFields as any}
        initialData={useMemo(() => ({
          nickname: initialData.nickname,
          playerId: initialData.playerId,
          fullname: initialData.fullname ?? "",
          countryId: String(initialData.countryId),
          birthday: initialData.birthday ? new Date(initialData.birthday).toISOString().slice(0, 10) : "",
          createdAt: initialData.createdAt,
        }), [initialData])}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        validateAsyncMap={validateAsyncMap as any}
        extraContent={(
          <InlineSubABM<OnlineUserRow>
            title="Usuarios Online"
            columns={[
              { key: 'platform', label: 'Plataforma', render: (r) => platformLabel(r.platform) },
              { key: 'username', label: 'Username' },
              { key: 'idOnline', label: 'ID Online' },
              { key: 'state', label: 'Estado', render: (r) => (r.pending ? 'Nuevo (pendiente)' : r.toDelete ? 'Eliminar (pendiente)' : (r.deleted ? 'Eliminado' : 'Activo')) },
            ]}
            rows={onlineUsers}
            onStageAdd={stageAddOnlineUser}
            onStageDelete={stageDeleteOnlineUser}
            onStageUpdate={stageUpdateOnlineUser}
            pendingAdds={pendingAdds}
            pendingDeletes={pendingDeletes}
            pendingUpdates={pendingUpdates}
            addFields={[
              { key: 'platform', label: 'Plataforma', placeholder: 'Seleccionar plataforma', type: 'select', required: true, options: ONLINE_PLATFORM_OPTIONS },
              { key: 'username', label: 'Username', placeholder: 'Ingrese username', required: true },
              { key: 'idOnline', label: 'ID Online', placeholder: 'ID Online (opcional)' },
            ]}
          />
        )}
      />
    </div>
  );
}
