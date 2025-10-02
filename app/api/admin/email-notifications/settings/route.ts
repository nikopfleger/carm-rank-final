import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

;

export async function GET(request: NextRequest) {
    try {
        const authz = await ensureAbmManage();
        if ("error" in authz) return authz.error;

        // Obtener usuarios que pueden recibir notificaciones
        const users = await prisma.user.findMany({
            where: {
                deleted: false,
                isActive: true,
                role: {
                    in: [UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                receiveGameNotifications: true,
                receiveLinkNotifications: true,
                version: true // Incluir versión para optimistic locking
            },
            orderBy: [
                { role: 'asc' },
                { name: 'asc' }
            ]
        });

        // Obtener configuración de la cuenta de email primaria
        const emailAccount = await prisma.emailAccount.findFirst({
            where: {
                isPrimary: true,
                isActive: true,
                deleted: false
            },
            select: {
                id: true,
                name: true,
                fromAddress: true,
                organization: true,
                isActive: true
            }
        });

        return NextResponse.json({
            users,
            emailAccount,
            notificationTypes: {
                gameValidation: {
                    name: 'Validación de Juegos',
                    description: 'Notificaciones cuando se envían juegos para validar y cuando se aprueban',
                    field: 'receiveGameNotifications'
                },
                playerLink: {
                    name: 'Vinculación de Jugadores',
                    description: 'Notificaciones cuando se solicita vincular un jugador a una cuenta',
                    field: 'receiveLinkNotifications'
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo configuración de notificaciones:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authz = await ensureAbmManage();
        if ("error" in authz) return authz.error;

        const { userId, receiveGameNotifications, receiveLinkNotifications } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'userId es requerido' },
                { status: 400 }
            );
        }

        // Verificar que el usuario existe y tiene permisos apropiados
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                deleted: false,
                isActive: true,
                role: {
                    in: [UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                receiveGameNotifications: true,
                receiveLinkNotifications: true,
                version: true // Incluir versión para optimistic locking
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado o sin permisos' },
                { status: 404 }
            );
        }

        // Actualizar preferencias de notificación con optimistic locking
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
                version: user.version // Optimistic locking
            },
            data: {
                receiveGameNotifications: receiveGameNotifications ?? user.receiveGameNotifications,
                receiveLinkNotifications: receiveLinkNotifications ?? user.receiveLinkNotifications
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                receiveGameNotifications: true,
                receiveLinkNotifications: true,
                version: true // Incluir versión en la respuesta
            }
        });

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Error actualizando configuración de notificaciones:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
