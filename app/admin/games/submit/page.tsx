import { ImprovedSubmitGameForm } from "@/components/admin/improved-submit-game-form";
import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function SubmitGamePage() {
  // ✅ Verificar autenticación y permisos para anotar juegos
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = session.user.role;
  const authorities = session.user.authorities || [];
  const canSubmitGames = role === "SUPER_ADMIN" || role === "ADMIN" || hasAuthority(authorities, "GAME_SUBMIT");

  if (!canSubmitGames) {
    redirect("/auth/error?error=AccessDenied");
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Versión desktop con Card */}
        <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Anotar Juego - Planilla Digital
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Completa la planilla como en una partida presencial. El sistema calculará automáticamente Uma, Oka y posiciones finales.
            </p>
          </div>
          <div className="p-6">
            <ImprovedSubmitGameForm />
          </div>
        </div>

        {/* Versión móvil sin Card externa */}
        <div className="md:hidden">
          {/* Header compacto */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Anotar Juego - Planilla Digital
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Completa la planilla como en una partida presencial. El sistema calculará automáticamente Uma, Oka y posiciones finales.
            </p>
          </div>
          <ImprovedSubmitGameForm />
        </div>
      </div>
    </main>
  );
}
