import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { serializeBigInt } from '@/lib/serialize-bigint';
import { ensureAbmManage } from "@/lib/server-authorization";
import { LinkRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH - Actualizar solicitud de vinculación (aprobar/rechazar)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(serializeBigInt({ error: "Unauthorized" }), { status: 500 });
    }

    try {
        const { id } = await params;
        const { status, reason } = await request.json();

        if (!status || !Object.values(LinkRequestStatus).includes(status)) {
            return NextResponse.json(serializeBigInt({ error: "Status inválido" }), { status: 500 });
        }

        const requestId = parseInt(id);
        if (isNaN(requestId)) {
            return NextResponse.json(serializeBigInt({ error: "ID inválido" }), { status: 500 });
        }

        // Verificar que la solicitud existe
        const existingRequest = await prisma.userPlayerLinkRequest.findUnique({
            where: { id: requestId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                player: { select: { id: true, nickname: true, playerNumber: true } }
            }
        });

        if (!existingRequest) {
            return NextResponse.json(serializeBigInt({ error: "Solicitud no encontrada" }), { status: 500 });
        }

        // Si se está aprobando, verificar que no haya conflictos
        if (status === LinkRequestStatus.APPROVED) {
            // Verificar que el usuario no esté ya vinculado
            const existingUserLink = await prisma.userPlayerLink.findUnique({
                where: { userId: existingRequest.userId }
            });

            if (existingUserLink) {
                return NextResponse.json(serializeBigInt({
                    error: "El usuario ya está vinculado a otro jugador"
                }), { status: 500 });
            }

            // Verificar que el jugador no esté ya vinculado
            const existingPlayerLink = await prisma.userPlayerLink.findUnique({
                where: { playerId: existingRequest.player.id }
            });

            if (existingPlayerLink) {
                return NextResponse.json(serializeBigInt({
                    error: "El jugador ya está vinculado a otro usuario"
                }), { status: 500 });
            }
        }

        // Actualizar la solicitud
        const updatedAtRequest = await prisma.userPlayerLinkRequest.update({
            where: { id: requestId },
            data: {
                status,
                approvedBy: session.user.id,
                approvedAt: new Date(),
                note: reason || existingRequest.note
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                player: { select: { id: true, nickname: true, playerNumber: true } }
            }
        });

        // Si se aprobó, crear el vínculo
        if (status === LinkRequestStatus.APPROVED) {
            await prisma.userPlayerLink.create({
                data: {
                    userId: existingRequest.userId,
                    playerId: existingRequest.player.id
                }
            });
        }

        return NextResponse.json(serializeBigInt({ request: updatedAtRequest }));
    } catch (error) {
        console.error("Error actualizando solicitud de vinculación:", error);
        return NextResponse.json(serializeBigInt({ error: "Error interno" }), { status: 500 });
    }
}

// DELETE - Eliminar solicitud de vinculación
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const { id } = await params;
        const requestId = parseInt(id);

        if (isNaN(requestId)) {
            return NextResponse.json(serializeBigInt({ error: "ID inválido" }), { status: 500 });
        }

        // Verificar que la solicitud existe
        const existingRequest = await prisma.userPlayerLinkRequest.findUnique({
            where: { id: requestId }
        });

        if (!existingRequest) {
            return NextResponse.json(serializeBigInt({ error: "Solicitud no encontrada" }), { status: 500 });
        }

        // Eliminar la solicitud (soft delete manejado por middleware)
        await prisma.userPlayerLinkRequest.delete({
            where: { id: requestId }
        });

        return NextResponse.json(serializeBigInt({ message: "Solicitud eliminada exitosamente" }));
    } catch (error) {
        console.error("Error eliminando solicitud de vinculación:", error);
        return NextResponse.json(serializeBigInt({ error: "Error interno" }), { status: 500 });
    }
}