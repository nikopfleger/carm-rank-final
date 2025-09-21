import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      );
    }

    // En serverless, redirigir a la ruta estática en /public/images
    const imageUrl = `/images/games/${filename}`;

    // Redirigir a la URL estática
    return NextResponse.redirect(new URL(imageUrl, request.url), 301);

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
