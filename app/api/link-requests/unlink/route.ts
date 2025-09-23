import { auth } from "@/lib/auth-vercel";
import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

;

export const dynamic = "force-dynamic";

// POST - Desvincular usuario del jugador actual (marcar como eliminado)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { playerId } = await request.json();
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

        // Verificar que existe la vinculación activa
        const existingLink = await prisma.userPlayerLink.findFirst({
            where: {
                userId: userId,
                playerId: Number(playerId),
                deleted: false
            }
        });

        if (!existingLink) {
            return NextResponse.json({
                error: "No estás vinculado a este jugador"
            }, { status: 400 });
        }

        // Marcar como eliminado (baja lógica)
        await prisma.userPlayerLink.update({
            where: { id: existingLink.id },
            data: {
                deleted: true,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "Vinculación eliminada exitosamente"
        });

    } catch (error) {
        console.error("Error desvinculando usuario:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
