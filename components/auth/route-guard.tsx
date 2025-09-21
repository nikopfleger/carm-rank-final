"use client";

import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import type { ReactNode } from "react";

type Role = "OWNER" | "SUPER_ADMIN" | "ADMIN";

interface RouteGuardProps {
	children: ReactNode;
	requiredRole?: Role;
}

export function RouteGuard({ children, requiredRole = "SUPER_ADMIN" }: RouteGuardProps) {
	const { isLoading, isAuthenticated, isAuthorized, user } = useAuthGuard(requiredRole);

	// Mostrar loading mientras se verifica la sesión
	if (isLoading) {
		return <LoadingOverlay message="Verificando permisos..." size="lg" fullScreen={true} />;
	}

	// Si el hook ya redirige, evitamos mostrar texto intermedio para que no haya "flash"
	if (!isAuthenticated || !user || !isAuthorized) {
		return null;
	}

	// Si todo está bien, mostrar el contenido
	return children;
}
