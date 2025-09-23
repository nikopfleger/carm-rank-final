"use client";

import { useAbmService } from "@/components/providers/services-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { AlertTriangle, Edit, Mail, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
    version: number;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EmailAccountsManagement() {
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<EmailAccount>>({
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
        connectionSecurity: "STARTTLS",
        isActive: true
    });

    const { handleError, handleSuccess } = useErrorHandler();
    const abmService = useAbmService();

    const loadEmailAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await abmService.getEmailAccounts() as any;
            setEmailAccounts(data);
        } catch (error) {
            handleError(error, "Error al cargar cuentas de email");
        } finally {
            setLoading(false);
        }
    }, [abmService, handleError]);

    useEffect(() => {
        loadEmailAccounts();
    }, [loadEmailAccounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await abmService.updateEmailAccount(editingAccount.id, formData);
                handleSuccess("Cuenta de email actualizada exitosamente");
            } else {
                await abmService.createEmailAccount(formData);
                handleSuccess("Cuenta de email creada exitosamente");
            }
            setShowForm(false);
            setEditingAccount(null);
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
                connectionSecurity: "STARTTLS",
                isActive: true
            });
            loadEmailAccounts();
        } catch (error) {
            handleError(error, "Error al guardar cuenta de email");
        }
    };

    const handleEdit = (account: EmailAccount) => {
        setEditingAccount(account);
        setFormData(account);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await abmService.deleteEmailAccount(id);
            handleSuccess("Cuenta de email eliminada exitosamente");
            loadEmailAccounts();
        } catch (error) {
            handleError(error, "Error al eliminar cuenta de email");
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await abmService.restoreEmailAccount(id);
            handleSuccess("Cuenta de email restaurada exitosamente");
            loadEmailAccounts();
        } catch (error) {
            handleError(error, "Error al restaurar cuenta de email");
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAccount(null);
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
            connectionSecurity: "STARTTLS",
            isActive: true
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando cuentas de email...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Cuentas de Email</h1>
                    <p className="text-gray-600">Administra las configuraciones SMTP para notificaciones</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Cuenta
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {editingAccount ? "Editar Cuenta de Email" : "Nueva Cuenta de Email"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="origin">Origen</Label>
                                    <Input
                                        id="origin"
                                        value={formData.origin || ""}
                                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="fromAddress">Dirección de Envío</Label>
                                    <Input
                                        id="fromAddress"
                                        type="email"
                                        value={formData.fromAddress || ""}
                                        onChange={(e) => setFormData({ ...formData, fromAddress: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="replyAddress">Dirección de Respuesta (Opcional)</Label>
                                    <Input
                                        id="replyAddress"
                                        type="email"
                                        value={formData.replyAddress || ""}
                                        onChange={(e) => setFormData({ ...formData, replyAddress: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="organization">Organización (Opcional)</Label>
                                    <Input
                                        id="organization"
                                        value={formData.organization || ""}
                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="server">Servidor SMTP</Label>
                                    <Input
                                        id="server"
                                        value={formData.server || ""}
                                        onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="port">Puerto</Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        value={formData.port || 587}
                                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="username">Usuario</Label>
                                    <Input
                                        id="username"
                                        value={formData.username || ""}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password || ""}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="connectionSecurity">Seguridad de Conexión</Label>
                                    <Select
                                        value={formData.connectionSecurity || "STARTTLS"}
                                        onValueChange={(value) => setFormData({ ...formData, connectionSecurity: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">Ninguna</SelectItem>
                                            <SelectItem value="STARTTLS">STARTTLS</SelectItem>
                                            <SelectItem value="TLS">TLS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isPrimary"
                                        checked={formData.isPrimary || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                                    />
                                    <Label htmlFor="isPrimary">Cuenta Principal</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                    <Label htmlFor="isActive">Activa</Label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingAccount ? "Actualizar" : "Crear"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailAccounts.map((account) => (
                    <Card key={account.id} className={account.deleted ? "opacity-50" : ""}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {account.name}
                                        {account.isPrimary && (
                                            <Badge variant="default" className="text-xs">Principal</Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600">{account.origin}</p>
                                </div>
                                <div className="flex space-x-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(account)}
                                        disabled={account.deleted}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => account.deleted ? handleRestore(account.id) : handleDelete(account.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-medium">Servidor:</span> {account.server}:{account.port}
                                </div>
                                <div>
                                    <span className="font-medium">Usuario:</span> {account.username}
                                </div>
                                <div>
                                    <span className="font-medium">Seguridad:</span> {account.connectionSecurity}
                                </div>
                                <div>
                                    <span className="font-medium">Estado:</span>{" "}
                                    <Badge variant={account.isActive ? "default" : "secondary"}>
                                        {account.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                                {account.deleted && (
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            Esta cuenta está marcada como eliminada
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {emailAccounts.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cuentas de email</h3>
                        <p className="text-gray-600 mb-4">Crea tu primera cuenta de email para configurar las notificaciones</p>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Cuenta
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
