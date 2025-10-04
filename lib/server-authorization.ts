import { auth } from "@/lib/auth-vercel";
import { hasAuthority, hasRequiredRole, isAdminFromRole } from "@/lib/authorization";
import { prisma } from "@/lib/database/client";
import type { UserRole } from "@/types/user-role";
import { NextResponse } from "next/server";

export async function ensureAbmManage() {
    const session = await auth();
    if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    const { role, authorities = [] } = session.user;
    const allowed = isAdminFromRole(role || undefined) || hasAuthority(authorities, "ABM_MANAGE");
    if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    return { session } as const;
}

export async function ensureGameSubmit() {
    const session = await auth();
    if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    const { role, authorities = [] } = session.user;
    const userRole = role as UserRole;
    const allowed = hasRequiredRole(userRole, "MODERATOR") || hasAuthority(authorities, "GAME_SUBMIT");
    if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    return { session } as const;
}

export async function ensureGameValidate() {
    const session = await auth();
    if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    const { role, authorities = [] } = session.user;
    const userRole = role as UserRole;
    const allowed = hasRequiredRole(userRole, "MODERATOR") || hasAuthority(authorities, "GAME_VALIDATE");
    if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    return { session } as const;
}

export async function ensureCanEditPlayer(playerId: bigint) {
    const session = await auth();
    if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    const { role, authorities = [], id } = session.user;

    // Admin permission check using unified helpers
    const isAdmin = isAdminFromRole(role || undefined) || hasAuthority(authorities, "ABM_MANAGE");
    if (isAdmin) return { session } as const;

    // Check ownership via link
    if (!id) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    const link = await prisma.userPlayerLink.findUnique({ where: { userId: id } });
    if (link && link.playerId === playerId) return { session } as const;
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}
