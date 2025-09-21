import { SeasonManagement } from "@/components/admin/season-management";
import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function SeasonsPage() {
  // ✅ Verificar autenticación y permisos para gestionar temporadas
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role;
  const authorities = session.user.authorities || [];
  const canManageSeasons = role === "SUPER_ADMIN" || hasAuthority(authorities, "ABM_MANAGE");

  if (!canManageSeasons) {
    redirect("/auth/error?error=AccessDenied");
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Temporadas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crear y administrar temporadas de mahjong riichi. Las temporadas definen los períodos de ranking.
            </p>
          </div>
          <div className="p-6">
            <SeasonManagement />
          </div>
        </div>
      </div>
    </main>
  );
}
