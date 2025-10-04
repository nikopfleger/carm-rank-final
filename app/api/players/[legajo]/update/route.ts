import { auth } from '@/lib/auth-vercel';
import { serializeBigInt } from '@/lib/serialize-bigint';
import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ legajo: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { legajo: legajoStr } = await params;
        const legajo = parseInt(legajoStr);
        if (isNaN(legajo)) {
            return NextResponse.json(
                { error: 'Legajo inválido' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { fullname, country, birthday } = body;

        // Verificar que el usuario esté vinculado a este jugador
        const userPlayerLink = await prisma.userPlayerLink.findFirst({
            where: {
                userId: session.user.id,
                player: {
                    playerNumber: legajo
                }
            },
            include: {
                player: true
            }
        });

        if (!userPlayerLink) {
            return NextResponse.json(
                { error: 'No tienes permisos para editar este jugador' },
                { status: 403 }
            );
        }

        // Validar datos
        const updatedAta: any = {};

        if (fullname !== undefined) {
            if (fullname && fullname.trim().length < 2) {
                return NextResponse.json(
                    { error: 'El nombre debe tener al menos 2 caracteres' },
                    { status: 400 }
                );
            }
            updatedAta.fullname = fullname?.trim() || null;
        }

        if (country !== undefined) {
            if (country) {
                // Buscar el país por código ISO
                const countryRecord = await prisma.country.findFirst({
                    where: { isoCode: country }
                });

                if (!countryRecord) {
                    return NextResponse.json(
                        { error: 'País no válido' },
                        { status: 400 }
                    );
                }

                updatedAta.countryId = countryRecord.id;
            } else {
                // Si no se especifica país, usar Argentina por defecto
                const defaultCountry = await prisma.country.findFirst({
                    where: { isoCode: 'ARG' }
                });
                updatedAta.countryId = defaultCountry?.id || 1;
            }
        }

        if (birthday !== undefined) {
            if (birthday) {
                const birthDate = new Date(birthday);
                const today = new Date();

                if (birthDate > today) {
                    return NextResponse.json(
                        { error: 'La fecha de nacimiento no puede ser futura' },
                        { status: 400 }
                    );
                }

                if (birthDate < new Date('1900-01-01')) {
                    return NextResponse.json(
                        { error: 'La fecha de nacimiento no puede ser anterior a 1900' },
                        { status: 400 }
                    );
                }

                // Guardar como Date object
                updatedAta.birthday = birthDate;
            } else {
                updatedAta.birthday = null;
            }
        }

        // Actualizar el jugador
        const updatedAtPlayer = await prisma.player.update({
            where: {
                playerNumber: legajo
            },
            data: updatedAta,
            select: {
                playerNumber: true,
                nickname: true,
                fullname: true,
                country: {
                    select: {
                        isoCode: true,
                        fullName: true
                    }
                },
                birthday: true
            }
        });

        return NextResponse.json({
            success: true,
            player: updatedAtPlayer
        });

    } catch (error) {
        console.error('Error updating player:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
