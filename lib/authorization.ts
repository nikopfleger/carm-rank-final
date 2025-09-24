import type { UserRole } from "@/types/user-role";

// ========================================
// TIPOS Y DEFINICIONES
// ========================================

export type Authority =
    | "*"
    | "USER_MANAGE"
    | "USER_GRANT_ADMIN"
    | "USER_GRANT_SUPER_ADMIN"
    | "ABM_MANAGE"
    | "GAME_SUBMIT"
    | "GAME_VALIDATE"
    | "TOURNAMENT_MANAGE"
    | "PLAYER_MANAGE"
    | "STATS_VIEW"
    | "EMAIL_MANAGE"
    | "LINK_REQUESTS_MANAGE";

export const ALL_AUTHORITIES: Authority[] = [
    "*",
    "USER_MANAGE",
    "USER_GRANT_ADMIN",
    "USER_GRANT_SUPER_ADMIN",
    "ABM_MANAGE",
    "GAME_SUBMIT",
    "GAME_VALIDATE",
    "TOURNAMENT_MANAGE",
    "PLAYER_MANAGE",
    "STATS_VIEW",
    "EMAIL_MANAGE",
    "LINK_REQUESTS_MANAGE",
];

// ========================================
// JERARQUÍA Y AUTHORITIES POR ROL
// ========================================

// Definir la jerarquía de roles (mayor a menor)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    OWNER: 5,
    SUPER_ADMIN: 4,
    ADMIN: 3,
    MODERATOR: 2,
    USER: 1,
};

// Definir authorities por rol (fuente única de verdad)
export const ROLE_AUTHORITIES: Record<UserRole, Authority[]> = {
    OWNER: ["*"], // Owner tiene todas las authorities
    SUPER_ADMIN: [
        "USER_MANAGE",
        "USER_GRANT_ADMIN",
        "ABM_MANAGE",
        "GAME_SUBMIT",
        "GAME_VALIDATE",
        "TOURNAMENT_MANAGE",
        "PLAYER_MANAGE",
        "STATS_VIEW",
        "EMAIL_MANAGE",
        "LINK_REQUESTS_MANAGE"
    ],
    ADMIN: [
        "USER_MANAGE",
        "ABM_MANAGE",
        "GAME_SUBMIT",
        "GAME_VALIDATE",
        "TOURNAMENT_MANAGE",
        "PLAYER_MANAGE",
        "STATS_VIEW",
        "EMAIL_MANAGE",
        "LINK_REQUESTS_MANAGE"
    ],
    MODERATOR: [
        "GAME_VALIDATE",
        "PLAYER_MANAGE",
        "STATS_VIEW"
    ],
    USER: [
        "STATS_VIEW"
    ],
};

// ========================================
// FUNCIONES DE AUTORIZACIÓN BÁSICA
// ========================================

export function hasAuthority(authorities: string[] | undefined, authority: Authority): boolean {
    if (!authorities) return false;
    return authorities.includes("*") || authorities.includes(authority);
}

export function mergeRoleAuthorities(role: UserRole, userAuthorities: string[] | undefined): Authority[] {
    const base = ROLE_AUTHORITIES[role] ?? [];
    const extra = (userAuthorities ?? []).filter((a) => a !== "*") as Authority[];
    const merged = new Set<Authority>([...base, ...extra]);
    return Array.from(merged);
}

// ========================================
// FUNCIONES DE COMPARACIÓN DE ROLES
// ========================================

export function hasRequiredRole(userRole?: UserRole, required?: UserRole): boolean {
    if (!userRole || !required) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function isAdminFromRole(role?: string): boolean {
    if (!role) return false;
    const userRole = role as UserRole;
    return hasRequiredRole(userRole, "ADMIN");
}

export function isOwnerFromRole(role?: string): boolean {
    return role === "OWNER";
}

// ========================================
// FUNCIONES DE GESTIÓN DE ROLES Y AUTHORITIES
// ========================================

// Verificar si un rol puede asignar otro rol
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    // OWNER puede asignar cualquier rol
    if (assignerRole === "OWNER") {
        return true;
    }

    // SUPER_ADMIN puede asignar cualquier rol excepto OWNER
    if (assignerRole === "SUPER_ADMIN") {
        return targetRole !== "OWNER";
    }

    // Solo se pueden asignar roles iguales o menores
    return ROLE_HIERARCHY[assignerRole] >= ROLE_HIERARCHY[targetRole];
}

// Verificar si un rol puede asignar una authority
export function canAssignAuthority(assignerRole: UserRole, authority: string): boolean {
    // OWNER puede asignar cualquier authority
    if (assignerRole === "OWNER") {
        return true;
    }

    // SUPER_ADMIN puede asignar cualquier authority
    if (assignerRole === "SUPER_ADMIN") {
        return true;
    }

    // Solo se pueden asignar authorities que el rol asignador tiene
    return ROLE_AUTHORITIES[assignerRole].includes(authority as Authority);
}

// Obtener authorities disponibles para un rol
export function getAvailableAuthorities(assignerRole: UserRole): Authority[] {
    // Si es OWNER, devolver todas las authorities (excepto "*")
    if (assignerRole === "OWNER") {
        return ALL_AUTHORITIES.filter(auth => auth !== "*");
    }

    return ROLE_AUTHORITIES[assignerRole];
}

// Obtener roles disponibles para asignar
export function getAvailableRoles(assignerRole: UserRole): UserRole[] {
    const availableRoles: UserRole[] = [];
    const assignerLevel = ROLE_HIERARCHY[assignerRole];

    for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
        const roleEnum = role as UserRole;

        // OWNER solo puede ser asignado por otro OWNER (y no debe haber múltiples)
        if (roleEnum === "OWNER") {
            if (assignerRole === "OWNER") {
                // Se permite en el dropdown pero no debería usarse para crear múltiples owners
                availableRoles.push(roleEnum);
            }
            continue;
        }

        // Solo puedes asignar roles de menor jerarquía que la tuya
        if (level < assignerLevel) {
            availableRoles.push(roleEnum);
        }
    }

    return availableRoles.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]); // Ordenar de mayor a menor
}

// Verificar si un usuario puede modificar a otro usuario
export function canModifyUser(
    modifierRole: UserRole,
    modifierId: string,
    targetRole: UserRole,
    targetId: string
): boolean {
    // No se puede modificar a sí mismo (excepto ciertos campos)
    if (modifierId === targetId) {
        return false;
    }

    // OWNER puede modificar a cualquiera
    if (modifierRole === "OWNER") {
        return true;
    }

    // SUPER_ADMIN puede modificar a cualquiera excepto OWNER
    if (modifierRole === "SUPER_ADMIN") {
        return targetRole !== "OWNER";
    }

    // Solo se pueden modificar usuarios con roles iguales o menores
    return ROLE_HIERARCHY[modifierRole] > ROLE_HIERARCHY[targetRole];
}

// Obtener el nivel de un rol
export function getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role];
}

// Obtener authorities por defecto para un rol
export function getDefaultAuthoritiesForRole(role: UserRole): Authority[] {
    return ROLE_AUTHORITIES[role] || [];
}

// Verificar si se debe prevenir múltiples owners
export function shouldPreventMultipleOwners(newRole: UserRole, currentUserRole: UserRole): boolean {
    return newRole === "OWNER" && currentUserRole === "OWNER";
}