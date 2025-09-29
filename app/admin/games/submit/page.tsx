import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { redirect } from "next/navigation";
import { ClientSubmitGamePage } from "./client-page";

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

  return <ClientSubmitGamePage />;
}
