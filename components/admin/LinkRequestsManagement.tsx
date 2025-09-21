"use client";

import { useAbmService } from "@/components/providers/services-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { CheckCircle, Clock, Link as LinkIcon, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./LinkRequestsManagement.module.css";

interface LinkRequest {
    id: number;
    userId: string;
    playerId: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestDate: string;
    processedDate?: string;
    processedBy?: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    player: {
        id: number;
        nickname: string;
        playerId: number;
    };
}

export default function LinkRequestsManagement() {
    const [linkRequests, setLinkRequests] = useState<LinkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

    // Estados para el modal de confirmación
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "approve" | "reject" | "delete";
        requestId: number;
        requestData?: LinkRequest;
    }>({
        open: false,
        type: "approve",
        requestId: 0,
    });

    const { handleError, handleSuccess } = useErrorHandler();
    const abmService = useAbmService();

    const loadLinkRequests = async () => {
        try {
            setLoading(true);
            console.log('🔍 Cargando solicitudes de vinculación...');
            const response = await abmService.getLinkRequests() as any;
            console.log('📋 Respuesta completa:', response);
            const data = response.requests || response; // Manejar tanto { requests: [...] } como [...]
            console.log('📋 Datos procesados:', data);
            setLinkRequests(data);
        } catch (error) {
            console.error('❌ Error cargando solicitudes:', error);
            handleError(error, "Error al cargar solicitudes de vinculación");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLinkRequests();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await abmService.approveLinkRequest(id);
            handleSuccess("Solicitud aprobada exitosamente");
            loadLinkRequests();
        } catch (error) {
            handleError(error, "Error al aprobar solicitud");
        }
    };

    const handleReject = async (id: number) => {
        try {
            await abmService.rejectLinkRequest(id);
            handleSuccess("Solicitud rechazada exitosamente");
            loadLinkRequests();
        } catch (error) {
            handleError(error, "Error al rechazar solicitud");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await abmService.deleteLinkRequest(id);
            handleSuccess("Solicitud eliminada exitosamente");
            loadLinkRequests();
        } catch (error) {
            handleError(error, "Error al eliminar solicitud");
        }
    };

    // Funciones para abrir el modal de confirmación
    const openConfirmDialog = (type: "approve" | "reject" | "delete", requestId: number, requestData?: LinkRequest) => {
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
            } else if (type === "reject") {
                await handleReject(requestId);
            } else if (type === "delete") {
                await handleDelete(requestId);
            }
            // Cerrar el modal
            setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
            // El error ya se maneja en las funciones individuales
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary" className={`${styles.statusBadge} ${styles.statusBadgePending}`}><Clock className="h-3 w-3" />Pendiente</Badge>;
            case "APPROVED":
                return <Badge variant="default" className={`${styles.statusBadge} ${styles.statusBadgeApproved}`}><CheckCircle className="h-3 w-3" />Aprobada</Badge>;
            case "REJECTED":
                return <Badge variant="destructive" className={`${styles.statusBadge} ${styles.statusBadgeRejected}`}><XCircle className="h-3 w-3" />Rechazada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredRequests = linkRequests.filter(request => {
        if (filter === "all") return true;
        return request.status === filter.toUpperCase();
    });

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingContent}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Cargando solicitudes de vinculación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestión de Solicitudes de Vinculación</h1>
                    <p className={styles.description}>Administra las solicitudes de vinculación entre usuarios y jugadores</p>
                </div>
            </div>

            {/* Filtros */}
            <div className={styles.filters}>
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    size="sm"
                >
                    Todas ({linkRequests.length})
                </Button>
                <Button
                    variant={filter === "pending" ? "default" : "outline"}
                    onClick={() => setFilter("pending")}
                    size="sm"
                >
                    Pendientes ({linkRequests.filter(r => r.status === "PENDING").length})
                </Button>
                <Button
                    variant={filter === "approved" ? "default" : "outline"}
                    onClick={() => setFilter("approved")}
                    size="sm"
                >
                    Aprobadas ({linkRequests.filter(r => r.status === "APPROVED").length})
                </Button>
                <Button
                    variant={filter === "rejected" ? "default" : "outline"}
                    onClick={() => setFilter("rejected")}
                    size="sm"
                >
                    Rechazadas ({linkRequests.filter(r => r.status === "REJECTED").length})
                </Button>
            </div>

            <div className={styles.requestsGrid}>
                {filteredRequests.map((request) => (
                    <Card key={request.id} className={styles.requestCard}>
                        <CardHeader>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardHeaderContent}>
                                    <div className={styles.iconContainer}>
                                        <LinkIcon className={styles.icon} />
                                    </div>
                                    <div>
                                        <CardTitle className={styles.cardTitle}>
                                            {request.user.name} → {request.player.nickname}
                                        </CardTitle>
                                        <p className={styles.cardSubtitle}>
                                            {request.user.email} • Jugador #{request.player.playerId}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.statusContainer}>
                                    {getStatusBadge(request.status)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className={styles.cardContent}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoSection}>
                                    <h4 className={styles.infoTitle}>Información del Usuario</h4>
                                    <div className={styles.infoContent}>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>Nombre:</span> <span className={styles.infoValue}>{request.user.name}</span></div>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>Email:</span> <span className={styles.infoValue}>{request.user.email}</span></div>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>ID:</span> <span className={styles.infoValue}>{request.user.id}</span></div>
                                    </div>
                                </div>
                                <div className={styles.infoSection}>
                                    <h4 className={styles.infoTitle}>Información del Jugador</h4>
                                    <div className={styles.infoContent}>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>Nickname:</span> <span className={styles.infoValue}>{request.player.nickname}</span></div>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>Player ID:</span> <span className={styles.infoValue}>{request.player.playerId}</span></div>
                                        <div className={styles.infoItem}><span className={styles.infoLabel}>ID:</span> <span className={styles.infoValue}>{request.player.id}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.datesSection}>
                                <div className={styles.datesGrid}>
                                    <div className={styles.dateItem}>
                                        <span className={styles.dateLabel}>Fecha de Solicitud:</span>
                                        <span className={styles.dateValue}>{new Date(request.requestDate).toLocaleString()}</span>
                                    </div>
                                    {request.processedDate && (
                                        <div className={styles.dateItem}>
                                            <span className={styles.dateLabel}>Fecha de Procesamiento:</span>
                                            <span className={styles.dateValue}>{new Date(request.processedDate).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {request.processedBy && (
                                        <div className={styles.dateItem}>
                                            <span className={styles.dateLabel}>Procesado por:</span>
                                            <span className={styles.dateValue}>{request.processedBy}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {request.status === "PENDING" && (
                                <div className={styles.actionsContainer}>
                                    <Button
                                        variant="outline"
                                        onClick={() => openConfirmDialog("reject", request.id, request)}
                                        className="flex items-center gap-2"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Rechazar
                                    </Button>
                                    <Button
                                        onClick={() => openConfirmDialog("approve", request.id, request)}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Aprobar
                                    </Button>
                                </div>
                            )}

                            {request.status === "REJECTED" && (
                                <div className={styles.actionsContainer}>
                                    <Button
                                        variant="outline"
                                        onClick={() => openConfirmDialog("delete", request.id, request)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredRequests.length === 0 && (
                <Card>
                    <CardContent className={styles.emptyState}>
                        <LinkIcon className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>
                            {filter === "all" ? "No hay solicitudes de vinculación" : `No hay solicitudes ${filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : "rechazadas"}`}
                        </h3>
                        <p className={styles.emptyDescription}>
                            {filter === "all"
                                ? "Las solicitudes de vinculación aparecerán aquí cuando los usuarios las envíen"
                                : "Cambia el filtro para ver otros tipos de solicitudes"
                            }
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Modal de confirmación */}
            <ConfirmationDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={
                    confirmDialog.type === "approve"
                        ? "Aprobar Solicitud"
                        : confirmDialog.type === "reject"
                            ? "Rechazar Solicitud"
                            : "Eliminar Solicitud"
                }
                description={
                    confirmDialog.type === "approve"
                        ? `¿Estás seguro de que quieres aprobar la solicitud de vinculación de ${confirmDialog.requestData?.user.name} con el jugador ${confirmDialog.requestData?.player.nickname}?`
                        : confirmDialog.type === "reject"
                            ? `¿Estás seguro de que quieres rechazar la solicitud de vinculación de ${confirmDialog.requestData?.user.name} con el jugador ${confirmDialog.requestData?.player.nickname}?`
                            : `¿Estás seguro de que quieres eliminar permanentemente esta solicitud de vinculación? Esta acción no se puede deshacer.`
                }
                confirmText={
                    confirmDialog.type === "approve"
                        ? "Aprobar"
                        : confirmDialog.type === "reject"
                            ? "Rechazar"
                            : "Eliminar"
                }
                cancelText="Cancelar"
                variant={
                    confirmDialog.type === "approve"
                        ? "success"
                        : confirmDialog.type === "reject"
                            ? "destructive"
                            : "destructive"
                }
                onConfirm={handleConfirmAction}
            />
        </div>
    );
}
