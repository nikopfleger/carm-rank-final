import { getResource } from '@/lib/abm/registry';
import { getPrismaClient } from '@/lib/database/connection';
import { NextResponse } from 'next/server';

export async function POST(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        console.log(`🔄 Restoring tournaments with id: ${id}`);

        const cfg = getResource('tournaments');
        console.log(`📋 Config for tournaments:`, {
            idField: cfg.idField,
            hasSelect: !!cfg.select,
            hasInclude: !!cfg.include
        });

        // Usar cliente directo para evitar problemas con el interceptor
        const directPrisma = getPrismaClient();

        // Mapear nombres de recursos a modelos de Prisma
        const modelMap: Record<string, string> = {
            'tournaments': 'tournament'
        };

        const modelName = modelMap['tournaments'] || 'tournament';
        const directModel = (directPrisma as any)[modelName];

        console.log(`🔍 Using direct model for restore: ${modelName}`);

        // Primero obtener el registro actual para conseguir la versión
        // Manejar diferentes tipos de ID (String vs Number)
        const idValue = Number(id);
        const current = await directModel.findFirst({
            where: {
                [cfg.idField!]: idValue,
                deleted: true
            },
            select: { version: true, deleted: true }
        });

        console.log(`📋 Current record:`, current);

        if (!current) {
            throw new Error(`Registro con ID ${id} no encontrado`);
        }

        if (!current.deleted) {
            throw new Error(`El registro con ID ${id} no está marcado como eliminado`);
        }

        // Restore usando cliente directo
        const updateData: any = {
            where: {
                [cfg.idField!]: idValue,
                version: current.version
            },
            data: { deleted: false }
        };

        // Solo agregar select/include si están definidos
        if (cfg.select) updateData.select = cfg.select;
        if (cfg.include) updateData.include = cfg.include;

        const restored = await directModel.update(updateData);

        console.log(`✅ Restored record:`, restored);

        console.log(`✅ Successfully restored tournaments ${id}`);
        return NextResponse.json({ success: true, data: restored });
    } catch (err: any) {
        console.error(`❌ Error restoring tournaments ${id}:`, err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        });
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}
