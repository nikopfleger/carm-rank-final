"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LinkRequestsManagement.module.css";

interface LinkRequest {
    id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    note?: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name?: string;
        email: string;
    };
    player: {
        id: number;
        playerNumber: number;
        nickname: string;
    };
}

export function LinkRequestsManagement() {
    const { t } = useI18nContext();
    const { handleError, handleSuccess } = useErrorHandler();
    const [requests, setRequests] = useState<LinkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    // Estados para el modal de confirmación
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "approve" | "delete";
        requestId: number;
        requestData?: LinkRequest;
    }>({
        open: false,
        type: "approve",
        requestId: 0,
    });

    // Cargar solicitudes
    const loadRequests = async () => {
        try {
            const response = await fetch('/api/admin/link-requests');
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // Aprobar solicitud
    const handleApprove = async (requestId: number) => {


        setProcessing(requestId);
        try {
            const response = await fetch(`/api/admin/link-requests/${requestId}/approve`, {
                method: 'POST',
            });

            if (response.ok) {
                handleSuccess('Solicitud aprobada exitosamente');
                await loadRequests();
            } else {
                const error = await response.json();
                handleError(error, 'Error aprobando solicitud');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            handleError(error, 'Error aprobando solicitud');
        } finally {
            setProcessing(null);
        }
    };

    // Funciones para abrir el modal de confirmación
    const openConfirmDialog = (type: "approve" | "delete", requestId: number, requestData?: LinkRequest) => {
        setConfirmDialog({
            open: true,
            type,
            requestId,
            requestData,
        });
    };

    // Función para confirmar la acción
    const handleConfirmAction = async () => {
        const { type, requestId } = confirmDialog;

        try {
            if (type === "approve") {
                await handleApprove(requestId);
            } else if (type === "delete") {
                await handleDelete(requestId);
            }
            // Cerrar el modal
            setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
            // El error ya se maneja en las funciones individuales
        }
    };

    // Rechazar solicitud
    const handleReject = async (requestId: number) => {
        if (!rejectNote.trim()) {
            handleError('Por favor, proporciona una razón para el rechazo', 'Validación requerida');
            return;
        }

        setProcessing(requestId);
        try {
            const response = await fetch(`/api/admin/link-requests/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: rejectNote }),
            });

            if (response.ok) {
                handleSuccess('Solicitud rechazada exitosamente');
                await loadRequests();
                setRejectNote("");
                setRejectingId(null);
            } else {
                const error = await response.json();
                handleError(error, 'Error rechazando solicitud');
            }
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            handleError(error, 'Error rechazando solicitud');
        } finally {
            setProcessing(null);
        }
    };

    // Eliminar solicitud
    const handleDelete = async (requestId: number) => {


        setProcessing(requestId);
        try {
            const response = await fetch(`/api/admin/link-requests/${requestId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                handleSuccess('Solicitud eliminada exitosamente');
                await loadRequests();
            } else {
                const errorData = await response.json();
                handleError(errorData.error || errorData.message || 'Error desconocido', 'Error eliminando solicitud');
            }
        } catch (error) {
            console.error('Error eliminando solicitud:', error);
            handleError(error, 'Error eliminando solicitud');
        } finally {
            setProcessing(null);
        }
    };

    // Obtener badge de estado
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge variant="outline" className="badge-pending">
                        <Clock className="h-3 w-3" />
                        Pendiente
                    </Badge>
                );
            case 'APPROVED':
                return (
                    <Badge variant="outline" className="badge-approved">
                        <CheckCircle className="h-3 w-3" />
                        Aprobada
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge variant="outline" className="badge-rejected">
                        <XCircle className="h-3 w-3" />
                        Rechazada
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Filtrar solicitudes por estado
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const processedRequests = requests.filter(r => r.status !== 'PENDING');

    if (loading) {
        return <div className="p-6">Cargando solicitudes de vinculación...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">🔗 Gestión de Solicitudes de Vinculación</h2>
                <div className="text-sm text-gray-600">
                    {pendingRequests.length} pendientes • {processedRequests.length} procesadas
                </div>
            </div>

            {/* Solicitudes Pendientes */}
            {pendingRequests.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-yellow-700">
                        ⏳ Solicitudes Pendientes ({pendingRequests.length})
                    </h3>

                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className={styles.requestCard}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-lg">
                                                {request.player.nickname} (L{request.player.playerNumber})
                                            </h4>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                            <div><strong>Usuario:</strong> {request.user.name || request.user.email}</div>
                                            <div><strong>Email:</strong> {request.user.email}</div>
                                            <div><strong>Fecha:</strong> {new Date(request.createdAt).toLocaleString('es-ES')}</div>
                                            <div><strong>ID:</strong> #{request.id}</div>
                                        </div>
                                        {request.note && (
                                            <div className={styles.noteContainer}>
                                                <strong>Nota del usuario:</strong> {request.note}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => openConfirmDialog("approve", request.id, request)}
                                        disabled={processing === request.id}
                                        className="btn-approve"
                                    >
                                        {processing === request.id ? 'Procesando...' : '✅ Aprobar'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setRejectingId(request.id)}
                                        disabled={processing === request.id}
                                        className="btn-reject"
                                    >
                                        ❌ Rechazar
                                    </Button>
                                </div>

                                {/* Formulario de rechazo */}
                                {rejectingId === request.id && (
                                    <div className={styles.processedContainer}>
                                        <Label htmlFor={`reject-note-${request.id}`}>
                                            Razón del rechazo *
                                        </Label>
                                        <Textarea
                                            id={`reject-note-${request.id}`}
                                            value={rejectNote}
                                            onChange={(e) => setRejectNote(e.target.value)}
                                            placeholder="Explica por qué se rechaza esta solicitud..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                onClick={() => handleReject(request.id)}
                                                disabled={processing === request.id || !rejectNote.trim()}
                                                className="btn-reject"
                                            >
                                                {processing === request.id ? 'Procesando...' : 'Confirmar Rechazo'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setRejectingId(null);
                                                    setRejectNote("");
                                                }}
                                                className="btn-cancel"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Solicitudes Procesadas */}
            {processedRequests.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                        📋 Historial de Solicitudes ({processedRequests.length})
                    </h3>

                    <div className="space-y-3">
                        {processedRequests.map((request) => (
                            <div key={request.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold">
                                                {request.player.nickname} (L{request.player.playerNumber})
                                            </h4>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                            <div><strong>Usuario:</strong> {request.user.name || request.user.email}</div>
                                            <div><strong>Procesada:</strong> {new Date(request.updatedAt).toLocaleString('es-ES')}</div>
                                            <div><strong>ID:</strong> #{request.id}</div>
                                        </div>
                                        {request.note && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                <strong>Nota:</strong> {request.note}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openConfirmDialog("delete", request.id, request)}
                                        disabled={processing === request.id}
                                    >
                                        {processing === request.id ? 'Eliminando...' : '🗑️ Eliminar'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Sin solicitudes */}
            {requests.length === 0 && (
                <Card className="p-6">
                    <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📭</div>
                        <div className="text-lg font-medium">No hay solicitudes de vinculación</div>
                        <div className="text-sm">Las solicitudes aparecerán aquí cuando los usuarios las envíen</div>
                    </div>
                </Card>
            )}

            {/* Modal de confirmación */}
            <ConfirmationDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={
                    confirmDialog.type === "approve"
                        ? "Aprobar Solicitud"
                        : "Eliminar Solicitud"
                }
                description={
                    confirmDialog.type === "approve"
                        ? `¿Estás seguro de que quieres aprobar la solicitud de vinculación de ${confirmDialog.requestData?.user.name} con el jugador ${confirmDialog.requestData?.player.nickname}?`
                        : `¿Estás seguro de que quieres eliminar permanentemente esta solicitud de vinculación? Esta acción no se puede deshacer.`
                }
                confirmText={
                    confirmDialog.type === "approve"
                        ? "Aprobar"
                        : "Eliminar"
                }
                cancelText="Cancelar"
                variant={
                    confirmDialog.type === "approve"
                        ? "success"
                        : "destructive"
                }
                onConfirm={handleConfirmAction}
            />
        </div>
    );
}
