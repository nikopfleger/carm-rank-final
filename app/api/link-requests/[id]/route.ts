import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { LinkRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    const { id: idParam } = await params;
    const id = Number(idParam);
    const { action, note } = await request.json();

    if (!action || !["APPROVE", "REJECT"].includes(String(action).toUpperCase())) {
        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const req = await prisma.userPlayerLinkRequest.findUnique({ where: { id } });
    if (!req) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (req.status !== LinkRequestStatus.PENDING) {
        return NextResponse.json({ error: "La solicitud no está pendiente" }, { status: 400 });
    }

    if (String(action).toUpperCase() === "REJECT") {
        const updatedAt = await prisma.userPlayerLinkRequest.update({
            where: { id },
            data: {
                status: LinkRequestStatus.REJECTED,
                note: note ? String(note) : req.note,
                approvedBy: authz.session.user.id,
                approvedAt: new Date(),
            },
        });
        return NextResponse.json({ request: updatedAt });
    }

    // APPROVE: ensure neither user nor player already linked
    const existingLinkByUser = await prisma.userPlayerLink.findUnique({ where: { userId: req.userId } });
    if (existingLinkByUser) {
        return NextResponse.json({ error: "El usuario ya está vinculado" }, { status: 400 });
    }
    const existingLinkByPlayer = await prisma.userPlayerLink.findUnique({ where: { playerId: req.playerId } });
    if (existingLinkByPlayer) {
        return NextResponse.json({ error: "El jugador ya está vinculado" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.userPlayerLink.create({
            data: {
                userId: req.userId,
                playerId: req.playerId,
            },
        });
        const updatedAtReq = await tx.userPlayerLinkRequest.update({
            where: { id },
            data: {
                status: LinkRequestStatus.APPROVED,
                note: note ? String(note) : req.note,
                approvedBy: authz.session.user.id,
                approvedAt: new Date(),
            },
        });
        return updatedAtReq;
    });

    return NextResponse.json({ request: result });
}
