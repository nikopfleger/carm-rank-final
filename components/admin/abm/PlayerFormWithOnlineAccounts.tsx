"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AddFieldDef, InlineSubABM, SubABMRow } from "./InlineSubABM";

interface OnlineUser extends SubABMRow {
    id: number;
    platform: string;
    username: string;
    playerId: number; // Este es el ID del jugador en la BD
    idOnline?: number; // Este es el player_id opcional
    isActive: boolean;
}

interface PlayerFormData {
    nickname: string;
    fullname?: string;
    countryId: number;
    playerId: number; // Este es el legajo, se mapea a playerNumber en la API
    birthday?: string;
}

interface Country {
    id: number;
    name_es: string;
    iso_code: string;
}

interface PlayerFormWithOnlineAccountsProps {
    title?: string;
    initialData?: any;
    countries: Country[];
    onSubmit: (data: { player: PlayerFormData; onlineUsers: OnlineUser[] }) => void;
    onCancel: () => void;
    validateNickname: (value: string) => Promise<string | null>;
    validateLegajo: (value: number) => Promise<string | null>;
    showCard?: boolean;
    onRevertSubgrid?: (revertFn: () => void) => void;
}

export function PlayerFormWithOnlineAccounts({
    title,
    initialData = {},
    countries,
    onSubmit,
    onCancel,
    validateNickname,
    validateLegajo,
    showCard = true,
    onRevertSubgrid
}: PlayerFormWithOnlineAccountsProps) {
    const [formData, setFormData] = useState<PlayerFormData>({
        nickname: initialData.nickname || '',
        fullname: initialData.fullname || '',
        countryId: initialData.countryId || 0,
        playerId: initialData.playerId || 0,
        birthday: initialData.birthday ?
            (typeof initialData.birthday === 'string' ?
                initialData.birthday :
                new Date(initialData.birthday).toISOString().split('T')[0]
            ) : ''
    });

    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(
        (initialData.onlineUsers || []).map((ou: any) => ({
            ...ou,
            isActive: ou.isActive !== undefined ? ou.isActive : true
        }))
    );
    const [originalOnlineUsers, setOriginalOnlineUsers] = useState<OnlineUser[]>([]);
    const [pendingAdds, setPendingAdds] = useState<OnlineUser[]>([]);
    const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);
    const [pendingUpdates, setPendingUpdates] = useState<Record<number, Partial<OnlineUser>>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: number | null; itemName: string }>({
        isOpen: false,
        itemId: null,
        itemName: ''
    });

    // Validación en tiempo real
    const [nicknameError, setNicknameError] = useState<string | null>(null);
    const [legajoError, setLegajoError] = useState<string | null>(null);

    // Resetear estado cuando cambie initialData (al abrir/cerrar modal)
    useEffect(() => {
        // Solo resetear si initialData tiene contenido o es un objeto vacío (nuevo jugador)
        const hasData = initialData && Object.keys(initialData).length > 0;

        // Debug para fecha de nacimiento
        console.log('Initial data birthday:', initialData?.birthday, typeof initialData?.birthday);

        let birthdayValue = '';
        if (initialData?.birthday) {
            if (typeof initialData.birthday === 'string') {
                // Si viene como string, verificar si ya está en formato YYYY-MM-DD
                if (initialData.birthday.includes('T')) {
                    birthdayValue = initialData.birthday.split('T')[0];
                } else {
                    birthdayValue = initialData.birthday;
                }
            } else {
                // Si viene como Date object
                birthdayValue = new Date(initialData.birthday).toISOString().split('T')[0];
            }
        }

        setFormData({
            nickname: initialData?.nickname || '',
            fullname: initialData?.fullname || '',
            countryId: initialData?.countryId || 0,
            playerId: initialData?.playerId || 0,
            birthday: birthdayValue
        });

        const mappedOnlineUsers = (initialData?.onlineUsers || []).map((ou: any) => ({
            ...ou,
            isActive: ou.isActive !== undefined ? ou.isActive : true
        }));

        setOnlineUsers(mappedOnlineUsers);
        setOriginalOnlineUsers(mappedOnlineUsers); // Guardar copia original

        // Siempre resetear los estados pendientes
        setPendingAdds([]);
        setPendingDeletes([]);
        setPendingUpdates({});
        setErrors({});
        setNicknameError(null);
        setLegajoError(null);
    }, [initialData]);

    // Función para revertir cambios del subgrid (se llama desde el formulario principal)
    const revertSubgridChanges = useCallback(() => {
        setOnlineUsers(originalOnlineUsers);
        setPendingAdds([]);
        setPendingDeletes([]);
        setPendingUpdates({});
    }, [originalOnlineUsers]);

    // Usar ref para evitar loops infinitos
    const revertFnRef = useRef(revertSubgridChanges);
    revertFnRef.current = revertSubgridChanges;

    // Exponer la función para que el componente padre pueda llamarla
    React.useEffect(() => {
        if (onRevertSubgrid) {
            onRevertSubgrid(() => revertFnRef.current());
        }
    }, [onRevertSubgrid]);

    const validateField = async (field: string, value: any) => {
        if (field === 'nickname' && value) {
            const error = await validateNickname(value);
            setNicknameError(error);
            return error;
        }
        if (field === 'playerId' && value) {
            const error = await validateLegajo(value);
            setLegajoError(error);
            return error;
        }
        return null;
    };

    const handleInputChange = async (field: keyof PlayerFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Validación en tiempo real
        await validateField(field, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            // Validar campos requeridos
            const newErrors: Record<string, string> = {};
            if (!formData.nickname.trim()) newErrors.nickname = 'Nickname es requerido';
            if (!formData.countryId) newErrors.countryId = 'País es requerido';
            if (!formData.playerId) newErrors.playerId = 'Legajo es requerido';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            // Validar nickname y legajo únicos
            const nicknameErr = await validateNickname(formData.nickname);
            const legajoErr = await validateLegajo(formData.playerId);

            if (nicknameErr || legajoErr) {
                setErrors({
                    ...(nicknameErr && { nickname: nicknameErr }),
                    ...(legajoErr && { legajo: legajoErr })
                });
                return;
            }

            // Preparar datos de cuentas online
            const finalOnlineUsers = [
                ...onlineUsers, // Incluir todas las cuentas existentes
                ...pendingAdds   // Incluir cuentas nuevas
            ].map(ou => ({
                ...ou,
                ...pendingUpdates[ou.id] // Aplicar actualizaciones pendientes (incluyendo isActive)
            }));

            onSubmit({
                player: formData,
                onlineUsers: finalOnlineUsers
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Funciones para manejar la subgrid
    const handleStageAdd = (draft: Partial<OnlineUser>) => {
        const newOnlineUser: OnlineUser = {
            id: Date.now(), // ID temporal
            platform: draft.platform || '',
            username: draft.username || '',
            playerId: formData.playerId,
            idOnline: draft.playerId || undefined, // Mapear playerId del formulario a idOnline
            isActive: true, // Por defecto activo
            pending: true
        };
        setPendingAdds(prev => [...prev, newOnlineUser]);
    };

    const handleStageDelete = (id: number) => {
        // Marcar como eliminado (inactivo) inmediatamente
        if (id > 0) {
            // Para cuentas existentes, marcar como inactiva
            setPendingUpdates(prev => ({
                ...prev,
                [id]: { ...prev[id], isActive: false, deleted: true }
            }));

            // También actualizar el estado local inmediatamente para feedback visual
            setOnlineUsers(prev => prev.map(ou =>
                ou.id === id ? { ...ou, isActive: false, deleted: true } : ou
            ));
        } else {
            // Para cuentas nuevas pendientes, eliminarlas del array
            setPendingAdds(prev => prev.filter(ou => ou.id !== id));
        }
    };

    const handleStageRestore = (id: number) => {
        // Restaurar (marcar como activo)
        setPendingUpdates(prev => ({
            ...prev,
            [id]: { ...prev[id], isActive: true, deleted: false }
        }));

        // También actualizar el estado local inmediatamente para feedback visual
        setOnlineUsers(prev => prev.map(ou =>
            ou.id === id ? { ...ou, isActive: true, deleted: false } : ou
        ));
    };

    const confirmDelete = () => {
        if (deleteConfirm.itemId) {
            const id = deleteConfirm.itemId;
            // En lugar de eliminar, marcar como inactiva
            if (id > 0) {
                // Para cuentas existentes, marcar como inactiva
                setPendingUpdates(prev => ({
                    ...prev,
                    [id]: { ...prev[id], isActive: false }
                }));

                // También actualizar el estado local inmediatamente para feedback visual
                setOnlineUsers(prev => prev.map(ou =>
                    ou.id === id ? { ...ou, isActive: false } : ou
                ));
            } else {
                // Para cuentas nuevas pendientes, eliminarlas del array
                setPendingAdds(prev => prev.filter(ou => ou.id !== id));
            }
        }
        setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' });
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleStageUpdate = (id: number, partial: Partial<OnlineUser>) => {
        setPendingUpdates(prev => ({ ...prev, [id]: partial }));

        // También actualizar el estado local inmediatamente para feedback visual
        setOnlineUsers(prev => prev.map(ou =>
            ou.id === id ? { ...ou, ...partial } : ou
        ));
    };


    const onlineUserColumns = [
        { key: 'platform', label: 'Plataforma', render: (row: OnlineUser) => row.platform },
        { key: 'username', label: 'Usuario', render: (row: OnlineUser) => row.username },
        { key: 'idOnline', label: 'Player ID', render: (row: OnlineUser) => row.idOnline || '-' },
        {
            key: 'isActive',
            label: 'Estado',
            render: (row: OnlineUser) => {
                const isDeleted = row.deleted || false;
                const isActive = row.isActive !== false;

                return (
                    <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDeleted
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                            {isDeleted ? 'Eliminado' : isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                );
            }
        }
    ];

    const addFields: AddFieldDef[] = [
        {
            key: 'platform',
            label: 'Plataforma',
            placeholder: 'Seleccionar plataforma',
            type: 'select',
            required: true,
            options: [
                { value: 'TENHOU', label: 'Tenhou' },
                { value: 'MAHJONG_SOUL', label: 'Mahjong Soul' },
                { value: 'RIICHI_CITY', label: 'Riichi City' }
            ]
        },
        {
            key: 'username',
            label: 'Usuario',
            placeholder: 'Nombre de usuario',
            type: 'text',
            required: true
        },
        {
            key: 'playerId',
            label: 'Player ID',
            placeholder: 'ID del jugador (opcional)',
            type: 'text',
            required: false
        }
    ];

    // Campos combinados para el InlineSubABM (incluye campos para agregar y editar)
    const allFields: AddFieldDef[] = [
        {
            key: 'platform',
            label: 'Plataforma',
            placeholder: 'Seleccionar plataforma',
            type: 'select',
            required: true,
            options: [
                { value: 'TENHOU', label: 'Tenhou' },
                { value: 'MAHJONG_SOUL', label: 'Mahjong Soul' },
                { value: 'RIICHI_CITY', label: 'Riichi City' }
            ]
        },
        {
            key: 'username',
            label: 'Usuario',
            placeholder: 'Nombre de usuario',
            type: 'text',
            required: true
        },
        {
            key: 'playerId',
            label: 'Player ID',
            placeholder: 'ID del jugador (opcional)',
            type: 'text',
            required: false
        },
        {
            key: 'idOnline',
            label: 'Player ID',
            placeholder: 'ID del jugador (opcional)',
            type: 'text',
            required: false
        }
    ];

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos del jugador */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="nickname">
                        Nickname <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        className={errors.nickname || nicknameError ? 'border-red-500' : ''}
                        placeholder="Nickname del jugador"
                    />
                    {(errors.nickname || nicknameError) && (
                        <p className="text-sm text-red-500">{errors.nickname || nicknameError}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="playerId">
                        Legajo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="playerId"
                        type="number"
                        value={formData.playerId || ''}
                        onChange={(e) => handleInputChange('playerId', parseInt(e.target.value) || 0)}
                        className={errors.playerId || legajoError ? 'border-red-500' : ''}
                        placeholder="Número de legajo"
                    />
                    {(errors.playerId || legajoError) && (
                        <p className="text-sm text-red-500">{errors.playerId || legajoError}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fullname">Nombre Completo</Label>
                    <Input
                        id="fullname"
                        value={formData.fullname}
                        onChange={(e) => handleInputChange('fullname', e.target.value)}
                        placeholder="Nombre completo del jugador"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="countryId">
                        País <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.countryId.toString()}
                        onValueChange={(value) => handleInputChange('countryId', parseInt(value))}
                    >
                        <SelectTrigger className={errors.countryId ? 'border-red-500' : ''}>
                            <span>
                                {countries.find(c => c.id === formData.countryId)?.name_es || 'Seleccionar país'}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            {countries.map(country => (
                                <SelectItem key={country.id} value={country.id.toString()}>
                                    {country.name_es}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.countryId && (
                        <p className="text-sm text-red-500">{errors.countryId}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="birthday">Fecha de Nacimiento</Label>
                    <Input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                    />
                </div>
            </div>

            {/* Subgrid para cuentas online */}
            <InlineSubABM
                title="Cuentas de Juego Online"
                columns={onlineUserColumns}
                rows={onlineUsers}
                onStageAdd={handleStageAdd}
                onStageDelete={handleStageDelete}
                onStageRestore={handleStageRestore}
                onStageUpdate={handleStageUpdate}
                pendingAdds={pendingAdds}
                pendingDeletes={pendingDeletes}
                pendingUpdates={pendingUpdates}
                addFields={allFields}
                customChangeCounter={
                    (pendingAdds.length > 0 || Object.keys(pendingUpdates).length > 0) && (
                        <div className="mt-2 text-xs text-gray-500">
                            Cambios pendientes: +{pendingAdds.length} / ~{Object.keys(pendingUpdates).length}. Se guardarán al presionar &quot;Guardar&quot;.
                        </div>
                    )
                }
            />

            {/* Botones */}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                        </>
                    )}
                </Button>
            </div>
        </form>
    );

    const fullContent = (
        <>
            {formContent}

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar la cuenta &quot;{deleteConfirm.itemName}&quot;?
                            <br />
                            <span className="text-sm text-gray-500">
                                La cuenta se marcará como inactiva en lugar de eliminarse completamente.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelDelete}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );

    if (!showCard) {
        return fullContent;
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {fullContent}
            </CardContent>
        </Card>
    );
}
