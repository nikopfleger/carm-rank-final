import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { emailNotificationService } from "@/lib/services/email-notification-service";
import { LinkRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a new link request by the current authenticated user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { playerId, note } = await request.json();
        const userId: string = session.user.id;

        if (!playerId) {
            return NextResponse.json({ error: "playerId requerido" }, { status: 400 });
        }

        // Verificar que el usuario existe en la base de datos
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({
                error: "Usuario no encontrado. Por favor, cierra sesión y vuelve a iniciar sesión."
            }, { status: 401 });
        }

        // Verificar que el usuario no esté ya vinculado a otro jugador (solo activos)
        const existingLink = await prisma.userPlayerLink.findFirst({
            where: {
                userId: userId,
                deleted: false
            }
        });

        if (existingLink) {
            return NextResponse.json({
                error: "Ya estás vinculado a otro jugador. Solo puedes estar vinculado a un jugador a la vez."
            }, { status: 400 });
        }

        const player = await prisma.player.findUnique({ where: { id: Number(playerId) } });
        if (!player) {
            return NextResponse.json({ error: "Jugador no existe" }, { status: 400 });
        }


        // Player cannot be already linked (solo activos)
        const existingLinkByPlayer = await prisma.userPlayerLink.findFirst({
            where: {
                playerId: Number(playerId),
                deleted: false
            }
        });
        if (existingLinkByPlayer) {
            return NextResponse.json({ error: "El jugador ya está vinculado a un usuario" }, { status: 400 });
        }

        // ✅ Verificar si el usuario tiene CUALQUIER solicitud rechazada (prevenir spam)
        const anyRejectedRequest = await prisma.userPlayerLinkRequest.findFirst({
            where: {
                userId: userId,
                status: 'REJECTED'
            }
        });

        if (anyRejectedRequest) {
            return NextResponse.json({
                error: "Tienes una solicitud de vinculación rechazada. No puedes crear nuevas solicitudes hasta que un administrador elimine las solicitudes rechazadas."
            }, { status: 400 });
        }

        // Verificar solicitudes existentes para este usuario y jugador
        const existingRequests = await prisma.userPlayerLinkRequest.findMany({
            where: {
                OR: [
                    { userId, playerId: Number(playerId) }, // Misma combinación usuario-jugador
                    { userId, status: LinkRequestStatus.PENDING }, // Usuario con solicitud pendiente
                    { playerId: Number(playerId), status: LinkRequestStatus.PENDING } // Jugador con solicitud pendiente
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Verificar si ya existe una solicitud para la misma combinación usuario-jugador
        const sameUserPlayerRequest = existingRequests.find(req =>
            req.userId === userId && req.playerId === Number(playerId)
        );

        if (sameUserPlayerRequest) {
            if (sameUserPlayerRequest.status === LinkRequestStatus.PENDING) {
                return NextResponse.json({
                    error: "Ya tienes una solicitud pendiente para este jugador",
                    requestId: sameUserPlayerRequest.id
                }, { status: 400 });
            } else if (sameUserPlayerRequest.status === LinkRequestStatus.APPROVED) {
                return NextResponse.json({
                    error: "Ya tienes una solicitud aprobada para este jugador",
                    requestId: sameUserPlayerRequest.id
                }, { status: 400 });
            } else if (sameUserPlayerRequest.status === LinkRequestStatus.REJECTED) {
                // Permitir nueva solicitud si la anterior fue rechazada
                console.log(`Permitiendo nueva solicitud para usuario ${userId} y jugador ${playerId} después de rechazo anterior`);
            }
        }

        // Verificar si el usuario ya tiene una solicitud pendiente para otro jugador
        const userPendingRequest = existingRequests.find(req =>
            req.userId === userId && req.status === LinkRequestStatus.PENDING
        );

        if (userPendingRequest && userPendingRequest.playerId !== Number(playerId)) {
            return NextResponse.json({
                error: "Ya tienes una solicitud pendiente para otro jugador",
                requestId: userPendingRequest.id,
                playerId: userPendingRequest.playerId
            }, { status: 400 });
        }

        // Verificar si el jugador ya tiene una solicitud pendiente de otro usuario
        const playerPendingRequest = existingRequests.find(req =>
            req.playerId === Number(playerId) && req.status === LinkRequestStatus.PENDING
        );

        if (playerPendingRequest && playerPendingRequest.userId !== userId) {
            return NextResponse.json({
                error: "Este jugador ya tiene una solicitud pendiente de otro usuario",
                requestId: playerPendingRequest.id
            }, { status: 400 });
        }

        const createdAt = await prisma.userPlayerLinkRequest.create({
            data: {
                userId,
                playerId: Number(playerId),
                note: note ? String(note) : null,
            },
        });

        // Enviar notificación por email a administradores
        try {
            await emailNotificationService.notifyPlayerLinkRequest({
                id: createdAt.id,
                playerName: player.nickname || player.fullname || `Jugador #${player.playerNumber}`,
                requestedBy: user.name || user.email,
                email: user.email,
                reason: note || undefined
            });
            console.log(`Notificación de solicitud ${createdAt.id} enviada a administradores`);
        } catch (emailError) {
            console.error('Error enviando notificación por email:', emailError);
            // No fallar la solicitud si el email falla
        }

        return NextResponse.json({ request: createdAt }, { status: 201 });
    } catch (error) {
        console.error("Error creando solicitud de vinculación:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// List link requests - require ABM manage; supports filtering by status and playerId
export async function GET(request: NextRequest) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const statusParam = request.nextUrl.searchParams.get("status");
    const playerIdParam = request.nextUrl.searchParams.get("playerId");

    let status: LinkRequestStatus | undefined = undefined;
    if (statusParam && (Object.values(LinkRequestStatus) as string[]).includes(statusParam)) {
        status = statusParam as LinkRequestStatus;
    }

    const where: any = {};
    if (status) where.status = status;
    if (playerIdParam) where.playerId = Number(playerIdParam);

    const requests = await prisma.userPlayerLinkRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            player: { select: { id: true, nickname: true, fullname: true } },
            user: { select: { id: true, email: true, name: true } },
        },
    });

    return NextResponse.json({ requests });
}
