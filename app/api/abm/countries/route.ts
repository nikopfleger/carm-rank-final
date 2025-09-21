import { onlyDeleted, prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/abm/countries - Obtener países
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deleted = searchParams.get('deleted') === 'true';
    const search = searchParams.get('search');

    let where: any = {};

    if (deleted) {
      where = onlyDeleted();
    }

    if (search) {
      where = {
        ...where,
        OR: [
          { isoCode: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { nationality: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const countries = await prisma.country.findMany({
      where,
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: countries,
      total: countries.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch countries',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/abm/countries - Crear país
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isoCode, fullName, nationality } = body;

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

    // Verificar si ya existe
    const existingCountry = await prisma.country.findFirst({
      where: {
        OR: [
          { isoCode },
          { fullName }
        ],
        deleted: false
      }
    });

    if (existingCountry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country already exists',
          errors: {
            isoCode: existingCountry.isoCode === isoCode ? 'Este código ISO ya existe' : undefined,
            fullName: existingCountry.fullName === fullName ? 'Este nombre ya existe' : undefined
          }
        },
        { status: 400 }
      );
    }

    const country = await prisma.country.create({
      data: {
        isoCode,
        fullName,
        nationality
      }
    });

    return NextResponse.json({
      success: true,
      data: country,
      message: 'País creado correctamente'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
