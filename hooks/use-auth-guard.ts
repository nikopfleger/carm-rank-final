"use client";

import { hasRequiredRole } from "@/lib/authorization"; // fuente única
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const AUTH_PREFIXES = ["/auth/signin", "/auth/error", "/api/auth"];

export function useAuthGuard(requiredRole?: UserRole) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Evita redirecciones múltiples en el mismo ciclo de vida
  const hasRedirected = useRef(false);

  // Estado derivado estable
  const userRole = session?.user?.role as UserRole | undefined;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const isAuthorized = isAuthenticated && hasRequiredRole(userRole, requiredRole);

  const onAuthPage = pathname === "/auth" || pathname.startsWith("/auth/") || pathname.startsWith("/api/auth");

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isLoading) return;

    // No intentes redirigir si ya estás en páginas de auth
    if (onAuthPage) return;

    // No autenticado → login con callbackUrl
    if (status === "unauthenticated") {
      hasRedirected.current = true;

      // Tomar ruta relativa actual (path + query + hash)
      const raw = typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : pathname;

      // Evitar usar páginas de /auth como destino
      const safe = raw.startsWith("/auth") ? "/" : raw;

      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(safe)}`);
      return;
    }

    // Autenticado pero sin autorización → error de acceso
    if (isAuthenticated && !isAuthorized) {
      hasRedirected.current = true;
      router.replace("/auth/error?error=AccessDenied");
    }
  }, [status, isLoading, isAuthenticated, isAuthorized, onAuthPage, pathname, router]);

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isAuthorized,
    user: session?.user,
  };
}
