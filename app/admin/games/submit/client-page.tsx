"use client";

import { ImprovedSubmitGameForm } from "@/components/admin/improved-submit-game-form";
import { useI18nContext } from "@/components/providers/i18n-provider";

export function ClientSubmitGamePage() {
    const { t } = useI18nContext();

    return (
        <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Versión desktop con Card */}
                <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('admin.submitGamePage.title')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {t('admin.submitGamePage.description')}
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
                            {t('admin.submitGamePage.title')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                            {t('admin.submitGamePage.description')}
                        </p>
                    </div>
                    <ImprovedSubmitGameForm />
                </div>
            </div>
        </main>
    );
}
