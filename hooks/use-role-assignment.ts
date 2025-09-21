import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function useRoleAssignment() {
  const { data: session, status, update } = useSession();
  const hasAssignedRole = useRef(false);
  const lastAssignedEmail = useRef<string | null>(null);
  const lastRole = useRef<string | null>(null);

  useEffect(() => {
    // Resetear si cambió el email (nuevo usuario)
    if (session?.user?.email !== lastAssignedEmail.current) {
      hasAssignedRole.current = false;
      lastAssignedEmail.current = session?.user?.email || null;
      lastRole.current = null;
    }

    // Resetear si cambió el rol (rol actualizado desde admin)
    if (session?.user?.role !== lastRole.current) {
      hasAssignedRole.current = false;
      lastRole.current = session?.user?.role || null;
    }

    // Solo ejecutar una vez por sesión
    if (hasAssignedRole.current) return;

    if (status !== "authenticated" || !session?.user?.email) return;

    // Evitar sobreescribir roles existentes o causar bucles
    if (session.user.role && ["OWNER", "SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"].includes(session.user.role)) {
      hasAssignedRole.current = true;
      return;
    }

    hasAssignedRole.current = true;
    assignRole(session.user.email);
  }, [session?.user?.email, session?.user?.role, status]); // Incluir role en las dependencias

  const assignRole = async (email: string) => {
    try {
      const response = await fetch("/api/auth/assign-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const { role } = await response.json();
        console.log(`Rol asignado: ${role}`);

        // Forzar actualización de la sesión para reflejar el nuevo rol
        await update();
      }
    } catch (error) {
      console.error("Error asignando rol:", error);
    }
  };
}
