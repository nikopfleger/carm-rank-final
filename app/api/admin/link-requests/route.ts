import { prisma } from "@/lib/database/client";
import { serializeBigInt } from "@/lib/serialize-bigint";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Listar todas las solicitudes de vinculación
export async function GET(request: NextRequest) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const requests = await prisma.userPlayerLinkRequest.findMany({
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
            },
            orderBy: [
                { status: 'asc' }, // PENDING primero
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json({ requests: serializeBigInt(requests) });
    } catch (error) {
        console.error("Error listando solicitudes de vinculación:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
