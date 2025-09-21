"use client";

import { EmailNotificationsSettings } from "@/components/admin/email-notifications-settings";
import { Mail, Settings } from "lucide-react";
import { Suspense } from "react";

export default function EmailNotificationsPage() {
    return (
        <div className="max-w-full mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Configuración de Notificaciones
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Gestiona las notificaciones por email del sistema
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <Settings className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">Cargando configuración...</p>
                        </div>
                    </div>
                }
            >
                <EmailNotificationsSettings />
            </Suspense>
        </div>
    );
}
