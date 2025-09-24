import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/abm/countries/[id] - Obtener país por ID
export async function GET(
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

    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        players: {
          where: { deleted: false },
          select: { id: true, nickname: true, fullname: true }
        }
      }
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: country
    });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/abm/countries/[id] - Actualizar país
export async function PUT(
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

    const body = await request.json();
    const { isoCode, fullName, nationality } = body;
    const expectedVersion = Number(body?.version ?? body?.__expectedVersion ?? body?.expectedVersion);
    if (!Number.isFinite(expectedVersion)) {
      return NextResponse.json({ success: false, error: "Falta versión para optimistic locking" }, { status: 409 });
    }

    // Validaciones
    if (!isoCode || !fullName || !nationality) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          errors: {
            isoCode: !isoCode ? 'Código ISO es requerido' : undefined,
            fullName: !fullName ? 'Nombre completo es requerido' : undefined,
            nationality: !nationality ? 'Nacionalidad es requerida' : undefined
          }
        },
        { status: 400 }
      );
    }

    // Validar formato del código ISO
    if (!/^[A-Z]{3}$/.test(isoCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ISO code format',
          errors: {
            isoCode: 'El código ISO debe ser de 3 letras mayúsculas'
          }
        },
        { status: 400 }
      );
    }

    // Verificar si el país existe
    const existingCountry = await prisma.country.findUnique({
      where: { id }
    });

    if (!existingCountry) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro país con el mismo código o nombre
    const duplicateCountry = await prisma.country.findFirst({
      where: {
        id: { not: id },
        OR: [
          { isoCode },
          { fullName }
        ],
        deleted: false
      }
    });

    if (duplicateCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country already exists',
          errors: {
            isoCode: duplicateCountry.isoCode === isoCode ? 'Este código ISO ya existe' : undefined,
            fullName: duplicateCountry.fullName === fullName ? 'Este nombre ya existe' : undefined
          }
        },
        { status: 400 }
      );
    }

    const country = await prisma.country.update({
      where: { id, version: expectedVersion },
      data: {
        isoCode,
        fullName,
        nationality
      }
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'País actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/abm/countries/[id] - Eliminar país (soft delete)
export async function DELETE(
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

    // Verificar si el país existe
    const existingCountry = await prisma.country.findUnique({
      where: { id },
      include: {
        players: {
          where: { deleted: false }
        }
      }
    });

    if (!existingCountry) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      );
    }

    // Verificar si tiene jugadores asociados
    if (existingCountry.players.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete country with associated players',
          message: `No se puede eliminar el país porque tiene ${existingCountry.players.length} jugador(es) asociado(s)`
        },
        { status: 400 }
      );
    }

    // Soft delete (el middleware se encarga de esto)
    await prisma.country.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'País eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
