import { prisma } from "@/lib/database/client";
import { ensureAbmManage } from "@/lib/server-authorization";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT - Actualizar cuenta de email
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const { id: idParam } = await params;
    const id = parseInt(idParam);
        const data = await request.json();

        // Verificar que la cuenta existe
        const existingAccount = await prisma.emailAccount.findUnique({
            where: { id, deleted: false }
        });

        if (!existingAccount) {
            return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
        }

        // Si se marca como principal, desmarcar las otras
        if (data.isPrimary) {
            await prisma.emailAccount.updateMany({
                where: { isPrimary: true, deleted: false, id: { not: id } },
                data: { isPrimary: false }
            });
        }

        const account = await prisma.emailAccount.update({
            where: { id },
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
                password: data.password || existingAccount.password, // Mantener password existente si no se proporciona
                connectionSecurity: data.connectionSecurity || "SSL/TLS",
                isActive: data.isActive !== false,
            }
        });

        return NextResponse.json({ account });
    } catch (error) {
        console.error("Error actualizando cuenta de email:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Eliminar cuenta de email (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authz = await ensureAbmManage();
    if ("error" in authz) return authz.error;

    try {
        const { id: idParam } = await params;
    const id = parseInt(idParam);

        // Verificar que la cuenta existe
        const existingAccount = await prisma.emailAccount.findUnique({
            where: { id, deleted: false }
        });

        if (!existingAccount) {
            return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
        }

        // Soft delete
        await prisma.emailAccount.update({
            where: { id },
            data: {
                deleted: true,
                isActive: false // También desactivar
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error eliminando cuenta de email:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
