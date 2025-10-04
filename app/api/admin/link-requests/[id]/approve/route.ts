import { prisma } from "@/lib/database/client";
import { emailService } from "@/lib/email-service";
import { serializeBigInt } from '@/lib/serialize-bigint';
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Aprobar solicitud de vinculación
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const { id: idParam } = await params;
        const requestId = parseInt(idParam);

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

        // Validar que el jugador existe
        if (!linkRequest.player) {
            return NextResponse.json(serializeBigInt({ error: "Jugador no encontrado en la solicitud" }), { status: 500 });
        }

        console.log('Datos de la solicitud:', {
            userId: linkRequest.userId,
            playerId: linkRequest.player.id,
            nickname: linkRequest.player.nickname
        });

        // Verificar que no existe ya un vínculo para este usuario o jugador
        const existingLink = await prisma.userPlayerLink.findFirst({
            where: {
                OR: [
                    { userId: linkRequest.userId },
                    { playerId: linkRequest.player.id }
                ]
            }
        });

        if (existingLink) {
            return NextResponse.json(serializeBigInt({
                error: "Ya existe un vínculo para este usuario o jugador"
            }), { status: 500 });
        }

        // Usar transacción para aprobar la solicitud y crear el vínculo
        const result = await prisma.$transaction(async (tx) => {
            // Actualizar el estado de la solicitud
            const updatedAtRequest = await tx.userPlayerLinkRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    updatedAt: new Date()
                }
            });

            // Validar datos antes de crear el vínculo
            if (!linkRequest.userId || !linkRequest.player.id) {
                throw new Error(`Datos faltantes: userId=${linkRequest.userId}, playerId=${linkRequest.player.id}`);
            }

            // Crear el vínculo usuario-jugador
            const newLink = await tx.userPlayerLink.create({
                data: {
                    userId: linkRequest.userId,
                    playerId: linkRequest.player.id,
                }
            });

            return { updatedAtRequest, newLink };
        });

        // Enviar notificación por email al usuario
        try {
            await emailService.sendEmail({
                to: linkRequest.user.email,
                subject: `Solicitud de vinculación aprobada - ${linkRequest.player.nickname}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">✅ Solicitud Aprobada</h2>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0369a1; margin-top: 0;">Tu solicitud ha sido aprobada</h3>
                            <p><strong>Jugador vinculado:</strong> ${linkRequest.player.nickname} (ID: ${linkRequest.player.id})</p>
                            <p><strong>Fecha de aprobación:</strong> ${new Date().toLocaleString('es-ES')}</p>
                        </div>
                        
                        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #166534;">
                                <strong>¡Felicidades!</strong> Ahora puedes acceder a tu perfil de jugador desde tu cuenta de usuario.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXTAUTH_URL}/player/${linkRequest.player.id}" 
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
            console.log(`Notificación de aprobación enviada a ${linkRequest.user.email}`);
        } catch (emailError) {
            console.error('Error enviando notificación de aprobación:', emailError);
            // No fallar la aprobación si el email falla
        }

        return NextResponse.json({
            success: true,
            message: "Solicitud aprobada exitosamente",
            link: result.newLink
        });
    } catch (error) {
        console.error("Error aprobando solicitud de vinculación:", error);
        return NextResponse.json(serializeBigInt({ error: "Error interno" }), { status: 500 });
    }
}
