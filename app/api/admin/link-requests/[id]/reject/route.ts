import { prisma } from "@/lib/database/client";
import { emailService } from "@/lib/email-service";
import { serializeBigInt } from '@/lib/serialize-bigint';
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Rechazar solicitud de vinculación
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const { id: idParam } = await params;
        const requestId = parseInt(idParam);
        const data = await request.json();
        const { note } = data;

        if (!note || !note.trim()) {
            return NextResponse.json(serializeBigInt({ error: "La razón del rechazo es requerida" }), { status: 500 });
        }

        // Verificar que la solicitud existe y está pendiente
        const linkRequest = await prisma.userPlayerLinkRequest.findUnique({
            where: { id: requestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                player: {
                    select: {
                        id: true,
                        playerNumber: true,
                        nickname: true,
                    }
                }
            }
        });

        if (!linkRequest) {
            return NextResponse.json(serializeBigInt({ error: "Solicitud no encontrada" }), { status: 500 });
        }

        if (linkRequest.status !== 'PENDING') {
            return NextResponse.json(serializeBigInt({ error: "La solicitud ya fue procesada" }), { status: 500 });
        }

        // Actualizar el estado de la solicitud
        const updatedAtRequest = await prisma.userPlayerLinkRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                note: note.trim(),
                updatedAt: new Date()
            }
        });

        // Enviar notificación por email al usuario
        try {
            await emailService.sendEmail({
                to: linkRequest.user.email,
                subject: `Solicitud de vinculación rechazada - ${linkRequest.player.nickname}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">❌ Solicitud Rechazada</h2>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #dc2626; margin-top: 0;">Tu solicitud ha sido rechazada</h3>
                            <p><strong>Jugador solicitado:</strong> ${linkRequest.player.nickname} (L${linkRequest.player.playerNumber})</p>
                            <p><strong>Fecha de rechazo:</strong> ${new Date().toLocaleString('es-ES')}</p>
                        </div>
                        
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #92400e; margin-top: 0;">Razón del rechazo:</h4>
                            <p style="margin: 0; color: #92400e;">${note.trim()}</p>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #0369a1;">
                                <strong>¿Qué puedes hacer?</strong><br>
                                • Revisar la información de tu solicitud<br>
                                • Contactar a los administradores si crees que hay un error<br>
                                • Enviar una nueva solicitud con información adicional
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXTAUTH_URL}/player/${linkRequest.player.playerNumber}" 
                               style="background-color: #0369a1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Ver Perfil del Jugador
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            Este es un email automático del sistema CARM Ranking.
                        </p>
                    </div>
                `
            });
            console.log(`Notificación de rechazo enviada a ${linkRequest.user.email}`);
        } catch (emailError) {
            console.error('Error enviando notificación de rechazo:', emailError);
            // No fallar el rechazo si el email falla
        }

        return NextResponse.json({
            success: true,
            message: "Solicitud rechazada exitosamente"
        });
    } catch (error) {
        console.error("Error rechazando solicitud de vinculación:", error);
        return NextResponse.json(serializeBigInt({ error: "Error interno" }), { status: 500 });
    }
}
