import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// 🌍 API PARA SERVIR TRADUCCIONES - SERVERLESS COMPATIBLE
// ============================================================================

// Importar traducciones estáticamente (serverless-friendly)
import enTranslations from '@/lib/i18n/translations/en.json';
import esTranslations from '@/lib/i18n/translations/es.json';
import jaTranslations from '@/lib/i18n/translations/ja.json';

const translations = {
    es: esTranslations,
    en: enTranslations,
    ja: jaTranslations
} as const;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ language: string }> }
) {
    try {
        const { language } = await params;

        // Validar que el idioma sea soportado
        const supportedLanguages = ['es', 'en', 'ja'] as const;
        if (!supportedLanguages.includes(language as any)) {
            return NextResponse.json(
                { error: 'Unsupported language' },
                { status: 400 }
            );
        }

        // Obtener traducciones de forma estática
        const translationData = translations[language as keyof typeof translations];

        if (!translationData) {
            return NextResponse.json(
                { error: 'Translation file not found' },
                { status: 404 }
            );
        }

        // Crear una copia para no mutar el original
        const responseData = { ...translationData };

        // Agregar timestamp para debugging en desarrollo
        if (process.env.NODE_ENV === 'development') {
            const now = new Date();
            (responseData as any)._timestamp = now.toISOString();
            (responseData as any)._debug = {
                loadedAt: now.toLocaleString('es-ES'),
                language: language,
                method: 'static_import',
                serverless: true
            };
        }

        // Configurar headers para cache
        const response = NextResponse.json(responseData);

        // Verificar si el cliente está pidiendo no-cache
        const cacheControl = request.headers.get('cache-control');
        const pragma = request.headers.get('pragma');

        if (cacheControl?.includes('no-cache') || pragma?.includes('no-cache') || process.env.NODE_ENV === 'development') {
            // No usar cache en desarrollo o cuando se especifica no-cache
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            response.headers.set('Pragma', 'no-cache');
            response.headers.set('Expires', '0');
            console.log(`🌍 API: Sirviendo traducciones sin cache para ${language}`);
        } else {
            // Cache normal en producción - usar etag basado en build time
            const buildTime = process.env.BUILD_TIME || Date.now().toString();
            const etag = `"${language}-${buildTime}"`;
            response.headers.set('ETag', etag);

            // Verificar si el cliente ya tiene la versión más reciente
            const ifNoneMatch = request.headers.get('If-None-Match');
            if (ifNoneMatch === etag) {
                return new NextResponse(null, { status: 304 }); // Not Modified
            }

            response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hora de cache
        }

        return response;

    } catch (error) {
        console.error('Error loading translations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}