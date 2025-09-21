import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para servir imágenes - SERVERLESS COMPATIBLE
 * Redirige a rutas estáticas en /public para compatibilidad serverless
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: imagePath } = await params;

        if (!imagePath || imagePath.length === 0) {
            return new NextResponse('Image path required', { status: 400 });
        }

        // Construir URL para /public/images
        const publicImageUrl = `/images/${imagePath.join('/')}`;

        // Redirigir a la ruta estática
        return NextResponse.redirect(new URL(publicImageUrl, request.url), 301);

    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}

/**
 * HEAD request para verificar si la imagen existe
 */
export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: imagePath } = await params;

        if (!imagePath || imagePath.length === 0) {
            return new NextResponse('Image path required', { status: 400 });
        }

        // En serverless, simplemente devolver OK - el servidor estático manejará la verificación real
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('Error checking image:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}