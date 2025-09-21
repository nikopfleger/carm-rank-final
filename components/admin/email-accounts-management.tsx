"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useEffect, useState } from "react";

interface EmailAccount {
    id: number;
    name: string;
    isPrimary: boolean;
    origin: string;
    fromAddress: string;
    replyAddress?: string;
    organization?: string;
    server: string;
    port: number;
    username: string;
    password: string;
    connectionSecurity: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export function EmailAccountsManagement() {
    const { t } = useI18nContext();
    const { handleError, handleSuccess } = useErrorHandler();
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Estados del formulario
    const [formData, setFormData] = useState({
        name: "",
        isPrimary: false,
        origin: "",
        fromAddress: "",
        replyAddress: "",
        organization: "",
        server: "",
        port: 587,
        username: "",
        password: "",
        connectionSecurity: "SSL/TLS",
        isActive: true,
    });

    // Cargar cuentas de email
    const loadAccounts = async () => {
        try {
            const response = await fetch('/api/admin/email-accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
            } else {
                handleError(await response.json(), 'Cargar cuentas de email');
            }
        } catch (error) {
            handleError(error, 'Cargar cuentas de email');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []); // handleError no debe afectar la carga de cuentas de email

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingAccount
                ? `/api/admin/email-accounts/${editingAccount.id}`
                : '/api/admin/email-accounts';

            const method = editingAccount ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await loadAccounts();
                resetForm();
                handleSuccess(
                    `Casilla de email ${editingAccount ? 'actualizada' : 'creada'} exitosamente`,
                    'Operación exitosa'
                );
            } else {
                const error = await response.json();
                handleError(error, 'Guardar cuenta de email');
            }
        } catch (error) {
            handleError(error, 'Guardar cuenta de email');
        }
    };

    // Resetear formulario
    const resetForm = () => {
        setFormData({
            name: "",
            isPrimary: false,
            origin: "",
            fromAddress: "",
            replyAddress: "",
            organization: "",
            server: "",
            port: 587,
            username: "",
            password: "",
            connectionSecurity: "SSL/TLS",
            isActive: true,
        });
        setEditingAccount(null);
        setIsCreating(false);
    };

    // Editar cuenta
    const handleEdit = (account: EmailAccount) => {
        setFormData({
            name: account.name,
            isPrimary: account.isPrimary,
            origin: account.origin,
            fromAddress: account.fromAddress,
            replyAddress: account.replyAddress || "",
            organization: account.organization || "",
            server: account.server,
            port: account.port,
            username: account.username,
            password: "", // No mostrar password existente
            connectionSecurity: account.connectionSecurity,
            isActive: account.isActive,
        });
        setEditingAccount(account);
        setIsCreating(false);
    };

    // Eliminar cuenta
    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta de email?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/email-accounts/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadAccounts();
                handleSuccess('Casilla de email eliminada exitosamente', 'Eliminación exitosa');
            } else {
                const error = await response.json();
                handleError(error, 'Eliminar cuenta de email');
            }
        } catch (error) {
            handleError(error, 'Eliminar cuenta de email');
        }
    };

    if (loading) {
        return <div className="p-6">Cargando cuentas de email...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📧 Gestión de Casillas de Email</h2>
                <Button onClick={() => setIsCreating(true)}>
                    ➕ Nueva Casilla
                </Button>
            </div>

            {/* Formulario */}
            {(isCreating || editingAccount) && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingAccount ? 'Editar Casilla' : 'Nueva Casilla'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ej: Cuenta Principal"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isPrimary"
                                    checked={formData.isPrimary}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                                />
                                <Label htmlFor="isPrimary">Cuenta principal</Label>
                            </div>

                            <div>
                                <Label htmlFor="origin">Origen *</Label>
                                <Input
                                    id="origin"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    placeholder="ej: CARM-Notificaciones"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="fromAddress">Dirección Origen *</Label>
                                <Input
                                    id="fromAddress"
                                    type="email"
                                    value={formData.fromAddress}
                                    onChange={(e) => setFormData({ ...formData, fromAddress: e.target.value })}
                                    placeholder="ej: notificaciones@carm.club"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="replyAddress">Dirección Respuesta</Label>
                                <Input
                                    id="replyAddress"
                                    type="email"
                                    value={formData.replyAddress}
                                    onChange={(e) => setFormData({ ...formData, replyAddress: e.target.value })}
                                    placeholder="ej: noreply@carm.club"
                                />
                            </div>

                            <div>
                                <Label htmlFor="organization">Organización</Label>
                                <Input
                                    id="organization"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    placeholder="ej: CARM - Club Argentino de Riichi Mahjong"
                                />
                            </div>

                            <div>
                                <Label htmlFor="server">Servidor *</Label>
                                <Input
                                    id="server"
                                    value={formData.server}
                                    onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                                    placeholder="ej: smtp.gmail.com"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="port">Puerto *</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={formData.port}
                                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                    placeholder="587"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="username">Usuario *</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="ej: usuario@gmail.com"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Contraseña *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="connectionSecurity">Seguridad de la conexión *</Label>
                                <Select
                                    value={formData.connectionSecurity}
                                    onValueChange={(value) => setFormData({ ...formData, connectionSecurity: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SSL/TLS">SSL/TLS</SelectItem>
                                        <SelectItem value="STARTTLS">STARTTLS</SelectItem>
                                        <SelectItem value="NONE">Ninguna</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Activa</Label>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit">
                                {editingAccount ? 'Actualizar' : 'Crear'}
                            </Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Lista de cuentas */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Casillas Configuradas</h3>

                {accounts.length === 0 ? (
                    <p className="text-gray-500">No hay casillas de email configuradas.</p>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div key={account.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">{account.name}</h4>
                                            {account.isPrimary && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                    Principal
                                                </span>
                                            )}
                                            {!account.isActive && (
                                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                    Inactiva
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                            <div><strong>Origen:</strong> {account.origin}</div>
                                            <div><strong>Email:</strong> {account.fromAddress}</div>
                                            <div><strong>Servidor:</strong> {account.server}:{account.port}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(account)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(account.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
