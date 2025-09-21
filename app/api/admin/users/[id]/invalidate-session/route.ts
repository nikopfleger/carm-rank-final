import { auth } from "@/lib/auth-vercel";
import { canModifyUser, hasAuthority } from "@/lib/authorization";
import { prisma } from "@/lib/database/client";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = session.user.role as UserRole;
    const requesterAuthorities = session.user.authorities || [];
    const canManageUsers =
        requesterRole === "OWNER" || // 👈 incluimos OWNER
        requesterRole === "SUPER_ADMIN" ||
        requesterRole === "ADMIN" ||
        hasAuthority(requesterAuthorities, "USER_MANAGE");

    if (!canManageUsers) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params; // 👈 await del Promise de params

    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, role: true },
    });
    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canModifyUser(requesterRole, session.user.id, targetUser.role as UserRole, targetUserId)) {
        return NextResponse.json(
            { error: "No tienes permisos para invalidar la sesión de este usuario" },
            { status: 403 }
        );
    }

    try {
        // Atómico: marca invalidación y elimina sesiones de BD
        await prisma.$transaction([
            prisma.user.update({
                where: { id: targetUserId },
                data: { sessionInvalidatedAt: new Date() },
            }),
            prisma.session.deleteMany({ where: { userId: targetUserId } }),
        ]);

        console.log(`✅ Sesiones invalidadas para ${targetUser.email} (${targetUserId})`);

        return NextResponse.json({
            success: true,
            message: "Sesiones del usuario invalidadas. Deberá iniciar sesión nuevamente.",
        });
    } catch (error) {
        console.error("Error invalidating user sessions:", error);
        return NextResponse.json(
            { success: false, message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
