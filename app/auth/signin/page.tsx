"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type Role = "OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER" | undefined;

function pickDefaultByRole(role: Role) {
  if (role === "OWNER" || role === "SUPER_ADMIN" || role === "ADMIN") return "/admin";
  return "/";
}

function sanitizeCallbackUrl(raw: string | null, role: Role): string {
  // Si no viene, manda por defecto según rol
  if (!raw) return pickDefaultByRole(role);

  try {
    // Permitir rutas relativas seguras
    if (raw.startsWith("/")) {
      // Evitar volver a páginas de auth para cortar loops
      if (raw.startsWith("/auth")) return pickDefaultByRole(role);
      return raw;
    }

    // Si es absoluta, validar same-origin y convertirla a relativa
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) {
      return pickDefaultByRole(role);
    }
    if (url.pathname.startsWith("/auth")) {
      return pickDefaultByRole(role);
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return pickDefaultByRole(role);
  }
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18nContext();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const redirected = useRef(false);

  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const rawCb = searchParams.get("callbackUrl");

  const target = useMemo(
    () => (typeof window === "undefined" ? "/" : sanitizeCallbackUrl(rawCb, (session?.user?.role as Role) ?? "USER")),
    // ojo: aunque session cambie, solo redirigimos una vez
    [rawCb, session?.user?.role]
  );

  useEffect(() => {
    if (redirected.current) return;

    // Solo redirigimos cuando hay sesión lista
    if (status === "authenticated" && session?.user) {
      const here = window.location.pathname + window.location.search + window.location.hash;

      // Si el destino es distinto y no es una página de auth, replace
      if (target !== here) {
        redirected.current = true;
        // console.log("✅ Redirigiendo a callbackUrl (seguro):", target);
        router.replace(target);
      } else {
        // Ya estamos en el destino; no hacemos nada
      }
    }
  }, [status, session?.user, target, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Usar el target saneado también aquí
      await signIn("google", { callbackUrl: window.location.origin + target });
    } catch (e) {
      console.error("Error signIn:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "authenticated" && session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingOverlay message={t("auth.already_signed_in", "Ya has iniciado sesión")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.sign_in", "Iniciar sesión")}</CardTitle>
          <CardDescription>
            {t("auth.sign_in_description", "Usa tu cuenta para continuar")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error === "session_invalidated" && (
            <Alert variant="destructive">
              <AlertDescription>
                🔒 Tu sesión ha sido invalidada por un administrador. Debes iniciar sesión nuevamente.
              </AlertDescription>
            </Alert>
          )}

          {error === "account_disabled" && (
            <Alert variant="destructive">
              <AlertDescription>
                ⚠️ {message || "Tu cuenta ha sido desactivada. Contacta al administrador."}
              </AlertDescription>
            </Alert>
          )}

          {error && !["session_invalidated", "account_disabled"].includes(error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {message || "Ha ocurrido un error. Intenta nuevamente."}
              </AlertDescription>
            </Alert>
          )}

          <Button className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? t("auth.signing_in", "Ingresando...") : t("auth.sign_in_with_google", "Ingresar con Google")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingOverlay message="Cargando..." />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
