import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Listar cuentas de email
export async function GET(request: NextRequest) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const accounts = await prisma.emailAccount.findMany({
            where: { deleted: false },
            orderBy: [
                { isPrimary: 'desc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error("Error listando cuentas de email:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Crear nueva cuenta de email
export async function POST(request: NextRequest) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const data = await request.json();

        // Validaciones básicas
        if (!data.name || !data.fromAddress || !data.server || !data.username || !data.password) {
            return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
        }

        // Si se marca como principal, desmarcar las otras
        if (data.isPrimary) {
            await prisma.emailAccount.updateMany({
                where: { isPrimary: true, deleted: false },
                data: { isPrimary: false }
            });
        }

        const account = await prisma.emailAccount.create({
            data: {
                name: data.name,
                isPrimary: data.isPrimary || false,
                origin: data.origin || "",
                fromAddress: data.fromAddress,
                replyAddress: data.replyAddress || null,
                organization: data.organization || null,
                server: data.server,
                port: data.port || 587,
                username: data.username,
                password: data.password,
                connectionSecurity: data.connectionSecurity || "SSL/TLS",
                isActive: data.isActive !== false,
            }
        });

        return NextResponse.json({ account }, { status: 201 });
    } catch (error) {
        console.error("Error creando cuenta de email:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
