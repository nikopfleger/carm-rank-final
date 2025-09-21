import { useSession } from "next-auth/react";
import { useCallback } from "react";

/**
 * Hook para manejar actualizaciones de sesión
 * Útil cuando se cambian roles o permisos desde el admin
 */
export function useSessionUpdate() {
    const { update } = useSession();

    const forceSessionUpdate = useCallback(async () => {
        try {
            await update();
            console.log("Sesión actualizada exitosamente");
        } catch (error) {
            console.error("Error actualizando sesión:", error);
        }
    }, [update]);

    return {
        forceSessionUpdate,
    };
}
