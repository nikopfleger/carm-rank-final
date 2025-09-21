import { StatisticsAnalytics } from "@/components/admin/statistics-analytics";
import { auth } from "@/lib/auth-vercel";
import { redirect } from "next/navigation";

export default async function StatisticsPage() {
  // ✅ Verificar autenticación y permisos para ver estadísticas
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role;

  const canViewStats = role === "OWNER" || role === "SUPER_ADMIN" || role === "ADMIN" || role === "MODERATOR";

  if (!canViewStats) {
    redirect("/auth/error?error=AccessDenied");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Estadísticas y Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análisis detallado del sistema de ranking y actividad de jugadores
          </p>
        </div>
      </div>
      <StatisticsAnalytics />
    </div>
  );
}
