import { Authority, hasAuthority, hasRequiredRole, isAdminFromRole, isOwnerFromRole } from "@/lib/authorization";
import type { UserRole } from "@/types/user-role";
import { signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  // Estados derivados básicos
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const isLoading = status === "loading";
  const user = session?.user;
  const userRole = user?.role as UserRole | undefined;
  const userAuthorities = user?.authorities;

  // Funciones de verificación puras (sin navegación)
  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAuthorityCheck = (authority: Authority): boolean => {
    return hasAuthority(userAuthorities, authority);
  };

  const isAdmin = (): boolean => {
    return isAdminFromRole(userRole);
  };

  const isOwner = (): boolean => {
    return isOwnerFromRole(userRole);
  };

  const isSuperAdmin = (): boolean => {
    return hasRequiredRole(userRole, "SUPER_ADMIN");
  };

  const isModerator = (): boolean => {
    return hasRequiredRole(userRole, "MODERATOR");
  };

  // Funciones de verificación con boolean return (sin navegación)
  const canAccess = (): boolean => {
    return isAuthenticated;
  };

  const canAccessRole = (role: UserRole): boolean => {
    return isAuthenticated && hasRole(role);
  };

  const canAccessAdmin = (): boolean => {
    return isAuthenticated && isAdmin();
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return {
    // Session data
    session,
    status,
    user,

    // Estados básicos
    isAuthenticated,
    isLoading,

    // Verificaciones de roles
    hasRole,
    hasAuthority: hasAuthorityCheck,
    isOwner,
    isAdmin,
    isSuperAdmin,
    isModerator,

    // Verificaciones de acceso (boolean sin navegación)
    canAccess,
    canAccessRole,
    canAccessAdmin,

    // Acciones
    logout,
  };
}
