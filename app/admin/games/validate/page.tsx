import { GameValidationList } from "@/components/admin/game-validation-list";
import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function ValidateGamesPage() {
  // ✅ Verificar autenticación y permisos para validar juegos
  const session = await auth();
  if (!session?.user || !hasAuthority(session.user.authorities, "GAME_VALIDATE")) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Validar Juegos Pendientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Revisa y valida los juegos enviados. Los juegos se procesan en orden de envío.
          </p>
        </div>
      </div>
      <GameValidationList />
    </div>
  );
}
