import { auth } from "@/lib/auth-vercel";
import { canAssignAuthority, canAssignRole, canModifyUser, getAvailableAuthorities, getDefaultAuthoritiesForRole, hasAuthority } from "@/lib/authorization";
import { prisma } from "@/lib/database/client";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = session.user.role as UserRole;
    const requesterAuthorities = session.user.authorities || [];
    const canManageUsers = requesterRole === "SUPER_ADMIN" || requesterRole === "ADMIN" || hasAuthority(requesterAuthorities, "USER_MANAGE");
    if (!canManageUsers) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idParam } = await params;
    const id = idParam;
    const body = await request.json();
    const { isActive, role, authorities } = body as { isActive?: boolean; role?: string; authorities?: string[] };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = target.role as UserRole;
    const isSelf = session.user.id === id;

    // Verificar si el usuario puede modificar al usuario objetivo
    if (!canModifyUser(requesterRole, session.user.id, targetRole, id)) {
        return NextResponse.json({
            error: "No tienes permisos para modificar este usuario"
        }, { status: 403 });
    }

    // No permitir auto-modificación de ciertos campos críticos
    if (isSelf && role && role !== requesterRole) {
        return NextResponse.json({
            error: "No puedes cambiar tu propio rol"
        }, { status: 400 });
    }

    let nextRole: UserRole | undefined = undefined;
    if (role !== undefined) {
        // Validar que el rol es válido
        if (!(Object.values(UserRole) as string[]).includes(role)) {
            return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
        }

        const newRole = role as UserRole;

        // Verificar si intenta crear múltiples owners
        if (newRole === "OWNER") {
            const existingOwners = await prisma.user.count({
                where: {
                    role: "OWNER",
                    id: { not: id }, // Excluir el usuario actual en caso de que ya sea owner
                    deleted: false
                }
            });

            if (existingOwners > 0) {
                return NextResponse.json({
                    error: "Solo puede haber un OWNER en el sistema"
                }, { status: 400 });
            }
        }

        // Verificar si puede asignar este rol
        if (!canAssignRole(requesterRole, newRole)) {
            return NextResponse.json({
                error: "No tienes permisos para asignar este rol"
            }, { status: 403 });
        }

        nextRole = newRole;
    }

    let nextAuthorities: string[] | undefined = authorities;

    // Si se está cambiando el rol, asignar authorities por defecto para el nuevo rol
    if (nextRole && nextRole !== targetRole) {
        nextAuthorities = getDefaultAuthoritiesForRole(nextRole);
        console.log(`Assigning default authorities for role ${nextRole}:`, nextAuthorities);
    } else if (authorities) {
        // Solo actualizar authorities si no se está cambiando el rol
        // Filtrar authorities que el usuario no puede asignar
        const availableAuthorities = getAvailableAuthorities(requesterRole);
        nextAuthorities = authorities.filter(authority =>
            availableAuthorities.includes(authority as any) &&
            canAssignAuthority(requesterRole, authority)
        );

        // Si se filtraron authorities, informar al usuario
        if (nextAuthorities.length !== authorities.length) {
            console.warn(`Some authorities were filtered out for user ${id}`);
        }
    }

    const updatedAt = await prisma.user.update({
        where: { id },
        data: {
            isActive: isActive !== undefined ? isActive : undefined,
            role: nextRole,
            authorities: nextAuthorities !== undefined ? nextAuthorities : undefined,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            authorities: true,
            isActive: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ user: updatedAt });
}

