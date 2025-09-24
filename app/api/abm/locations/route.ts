import { prisma } from '@/lib/database/client';
import { runWithRequestContext } from '@/lib/request-context.server';
import { NextRequest, NextResponse } from 'next/server';

;

interface LocationInput {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    extraData?: any;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';
        const search = (searchParams.get('search') ?? '').trim();

        const locations = await runWithRequestContext({ includeDeleted }, () => prisma.location.findMany({
            where: {
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { address: { contains: search, mode: 'insensitive' } },
                        { city: { contains: search, mode: 'insensitive' } },
                        { country: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            orderBy: [{ id: 'asc' }],
            include: {
                _count: { select: { tournaments: true, games: true } }
            }
        }));

        return NextResponse.json({ success: true, data: locations });

    } catch (error) {
        console.error("❌ Error obteniendo ubicaciones:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor",
                message: error instanceof Error ? error.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, address, city, country, extraData } = body as LocationInput;

        // Validar campos requeridos
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: "El nombre de la ubicación es requerido" },
                { status: 400 }
            );
        }

        // Verificar que no exista una ubicación con el mismo nombre
        const existingLocation = await prisma.location.findFirst({
            where: {
                name: name.trim(),
                deleted: false
            }
        });

        if (existingLocation) {
            return NextResponse.json(
                { error: "Ya existe una ubicación con ese nombre" },
                { status: 400 }
            );
        }

        const location = await prisma.location.create({
            data: {
                name: name.trim(),
                address: address?.trim() || null,
                city: city?.trim() || null,
                country: country?.trim() || null,
                extraData: extraData || null
            },
            include: {
                _count: {
                    select: {
                        tournaments: true,
                        games: true
                    }
                }
            }
        });

        console.log(`✅ Ubicación creada: ${location.name} (ID: ${location.id})`);

        return NextResponse.json({
            success: true,
            message: `Ubicación "${location.name}" creada exitosamente`,
            data: location
        });

    } catch (error) {
        console.error("❌ Error creando ubicación:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Error interno del servidor",
                message: error instanceof Error ? error.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}