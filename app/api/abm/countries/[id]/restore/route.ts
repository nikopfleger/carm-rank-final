import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/abm/countries/[id]/restore - Restaurar país
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid country ID' },
        { status: 400 }
      );
    }

    // Verificar si el país existe y está eliminado
    const existingCountry = await prisma.country.findUnique({
      where: { id }
    });

    if (!existingCountry) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      );
    }

    if (!existingCountry.deleted) {
      return NextResponse.json(
        { success: false, error: 'Country is not deleted' },
        { status: 400 }
      );
    }

    // Restaurar el país
    const country = await prisma.country.update({
      where: { id },
      data: {
        deleted: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'País restaurado correctamente'
    });
  } catch (error) {
    console.error('Error restoring country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to restore country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
