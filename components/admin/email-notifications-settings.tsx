"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { AlertCircle, CheckCircle, Mail, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface NotificationUser {
    id: string;
    name: string;
    email: string;
    role: string;
    receiveGameNotifications: boolean;
    receiveLinkNotifications: boolean;
    version: number; // Campo para optimistic locking
}

interface EmailAccount {
    id: number;
    name: string;
    fromAddress: string;
    organization?: string;
    isActive: boolean;
}

interface NotificationSettings {
    users: NotificationUser[];
    emailAccount: EmailAccount | null;
    notificationTypes: {
        [key: string]: {
            name: string;
            description: string;
            field: string;
        };
    };
}

export function EmailNotificationsSettings() {
    const { handleError, handleSuccess } = useErrorHandler();
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // Cargar configuración
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/email-notifications/settings');
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Datos recibidos de la API:', data);
                console.log('👥 Usuarios en la respuesta:', data.users);
                setSettings(data);
            } else {
                handleError(await response.json(), 'Cargar configuración de notificaciones');
            }
        } catch (error) {
            handleError(error, 'Cargar configuración de notificaciones');
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Actualizar preferencias de usuario
    const updateUserPreferences = async (
        userId: string,
        field: 'receiveGameNotifications' | 'receiveLinkNotifications',
        value: boolean
    ) => {
        try {
            setUpdating(userId);

            // Obtener la versión actual del usuario
            console.log('🔍 Buscando usuario:', userId, 'en settings:', settings);
            const currentUser = settings?.users?.find(u => u.id === userId);
            console.log('👤 Usuario encontrado:', currentUser);

            if (!currentUser) {
                handleError(new Error(`Usuario con ID ${userId} no encontrado en la lista`), 'Actualizar preferencias');
                return;
            }

            if (currentUser.version === undefined || currentUser.version === null) {
                handleError(new Error(`Usuario ${userId} no tiene campo version (valor: ${currentUser.version})`), 'Actualizar preferencias');
                return;
            }

            const response = await fetch('/api/admin/email-notifications/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    version: currentUser.version, // Incluir versión para optimistic locking
                    [field]: value
                })
            });

            if (response.ok) {
                const { user } = await response.json();

                // Actualizar estado local
                setSettings(prev => prev ? {
                    ...prev,
                    users: prev.users.map(u => u.id === userId ? { ...u, ...user } : u)
                } : null);

                handleSuccess('Preferencias actualizadas exitosamente', 'Configuración guardada');
            } else {
                handleError(await response.json(), 'Actualizar preferencias');
            }
        } catch (error) {
            handleError(error, 'Actualizar preferencias');
        } finally {
            setUpdating(null);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'OWNER': return 'destructive';
            case 'SUPER_ADMIN': return 'destructive';
            case 'ADMIN': return 'destructive';
            case 'MODERATOR': return 'default';
            default: return 'outline';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'OWNER': return 'Propietario';
            case 'SUPER_ADMIN': return 'Super Admin';
            case 'ADMIN': return 'Administrador';
            case 'MODERATOR': return 'Moderador';
            default: return role;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <Settings className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
                    <p className="text-gray-600">Error cargando la configuración</p>
                    <Button onClick={loadSettings} className="mt-4">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estado de la cuenta de email */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Cuenta de Email
                    </CardTitle>
                    <CardDescription>
                        Configuración de la cuenta de email para envío de notificaciones
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {settings.emailAccount ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium">{settings.emailAccount.name}</h4>
                                <p className="text-sm text-gray-600">{settings.emailAccount.fromAddress}</p>
                                {settings.emailAccount.organization && (
                                    <p className="text-sm text-gray-500">{settings.emailAccount.organization}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {settings.emailAccount.isActive ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Activa
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Inactiva
                                    </Badge>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/admin/abm/email-accounts')}
                                >
                                    <Settings className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <Mail className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">No hay cuenta de email configurada</p>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/admin/abm/email-accounts')}
                            >
                                Configurar Cuenta de Email
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Configuración de usuarios */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Preferencias de Notificación por Usuario
                    </CardTitle>
                    <CardDescription>
                        Configura qué usuarios reciben cada tipo de notificación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Encabezados */}
                        <div className="grid grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-gray-600">
                            <div className="col-span-4">Usuario</div>
                            <div className="col-span-2">Rol</div>
                            <div className="col-span-3 text-center">Validación de Juegos</div>
                            <div className="col-span-3 text-center">Vinculación de Jugadores</div>
                        </div>

                        {/* Lista de usuarios */}
                        {settings.users.map((user) => (
                            <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                                {/* Usuario */}
                                <div className="col-span-4">
                                    <div>
                                        <p className="font-medium">{user.name || 'Sin nombre'}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                    </div>
                                </div>

                                {/* Rol */}
                                <div className="col-span-2">
                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                        {getRoleLabel(user.role)}
                                    </Badge>
                                </div>

                                {/* Validación de Juegos */}
                                <div className="col-span-3 flex justify-center">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={user.receiveGameNotifications}
                                            onCheckedChange={(checked) =>
                                                updateUserPreferences(user.id, 'receiveGameNotifications', checked)
                                            }
                                            disabled={updating === user.id}
                                        />
                                        <Label className="text-sm">
                                            {user.receiveGameNotifications ? 'Activado' : 'Desactivado'}
                                        </Label>
                                    </div>
                                </div>

                                {/* Vinculación de Jugadores */}
                                <div className="col-span-3 flex justify-center">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={user.receiveLinkNotifications}
                                            onCheckedChange={(checked) =>
                                                updateUserPreferences(user.id, 'receiveLinkNotifications', checked)
                                            }
                                            disabled={updating === user.id}
                                        />
                                        <Label className="text-sm">
                                            {user.receiveLinkNotifications ? 'Activado' : 'Desactivado'}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {settings.users.length === 0 && (
                            <div className="text-center p-8 text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                                <p>No hay usuarios con permisos para recibir notificaciones</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Información sobre tipos de notificación */}
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Notificación</CardTitle>
                    <CardDescription>
                        Descripción de cada tipo de notificación disponible
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(settings.notificationTypes).map(([key, type]) => (
                            <div key={key} className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">{type.name}</h4>
                                <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
