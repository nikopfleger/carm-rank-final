import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const authorities = session.user.authorities || [];
    const canManageUsers = role === "OWNER" || role === "SUPER_ADMIN" || role === "ADMIN" || hasAuthority(authorities, "USER_MANAGE");

    if (!canManageUsers) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const search = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";
    const onlyActiveParam = request.nextUrl.searchParams.get("active");
    const onlyActive = onlyActiveParam === null ? undefined : onlyActiveParam === "true";

    const users = await prisma.user.findMany({
        where: {
            AND: [
                search
                    ? {
                        OR: [
                            { email: { contains: search, mode: "insensitive" } },
                            { name: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {},
                onlyActive !== undefined ? { isActive: onlyActive } : {},
            ],
        },
        orderBy: [{ createdAt: "asc" }],
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            authorities: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ users });
}
