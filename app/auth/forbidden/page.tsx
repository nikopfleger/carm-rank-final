"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
    const { t } = useI18nContext();
    const { session, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    {/* Icono de error */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                    </div>

                    {/* Título y mensaje */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {t("auth.forbidden.title", "Acceso Denegado")}
                        </h1>
                        <p className="text-gray-400 leading-relaxed">
                            {t("auth.forbidden.message", "No tienes permisos para acceder a esta sección del sistema.")}
                        </p>
                    </div>

                    {/* Información del usuario */}
                    {session?.user && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-6">
                            <div className="text-sm text-gray-300">
                                <div className="mb-1">
                                    <span className="font-medium">Usuario:</span> {session.user.email}
                                </div>
                                <div className="mb-1">
                                    <span className="font-medium">Rol:</span> {session.user.role || "Sin rol"}
                                </div>
                                <div>
                                    <span className="font-medium">Estado:</span>{" "}
                                    <span className={session.user.isActive ? "text-green-400" : "text-red-400"}>
                                        {session.user.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="space-y-3">
                        <Link href="/" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                <Home className="w-4 h-4 mr-2" />
                                {t("auth.forbidden.goHome", "Ir al Inicio")}
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t("auth.forbidden.goBack", "Volver Atrás")}
                        </Button>

                        {session && (
                            <Button
                                variant="outline"
                                className="w-full border-red-600 text-red-400 hover:bg-red-600/10"
                                onClick={logout}
                            >
                                {t("auth.forbidden.signOut", "Cerrar Sesión")}
                            </Button>
                        )}
                    </div>

                    {/* Contacto */}
                    <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                        <p className="text-sm text-gray-500">
                            {t("auth.forbidden.contact", "Si crees que esto es un error, contacta al administrador.")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
