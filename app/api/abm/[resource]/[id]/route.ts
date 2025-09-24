import { getResource } from '@/lib/abm/registry';
import { getPrismaClient } from '@/lib/database/connection';
import { NextResponse } from 'next/server';

export async function GET(
    _request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    try {
        const { resource, id } = await context.params;
        const cfg = getResource(resource);

        // Manejar diferentes tipos de ID (String vs Number)
        const idValue = resource === 'users' ? id : Number(id);
        const row = await cfg.model.findUnique({
            where: { [cfg.idField!]: idValue },
            select: cfg.select,
            include: cfg.include,
        });

        return NextResponse.json({ success: true, data: row });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    try {
        const { resource, id } = await context.params;
        const cfg = getResource(resource);
        const body = await request.json();

        const data = cfg.mapUpdate ? cfg.mapUpdate(body) : body;

        // Manejar diferentes tipos de ID (String vs Number)
        const idValue = resource === 'users' ? id : Number(id);
        const updated = await cfg.model.update({
            where: { [cfg.idField!]: idValue },
            data,
            select: cfg.select,
            include: cfg.include,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    const { resource, id } = await context.params;
    try {
        console.log(`🗑️ Deleting ${resource} with id: ${id}`);

        const cfg = getResource(resource);

        // Manejar diferentes tipos de ID (String vs Number)
        const idValue = resource === 'users' ? id : Number(id);

        // Primero obtener el registro actual para conseguir la versión
        const current = await cfg.model.findUnique({
            where: { [cfg.idField!]: idValue },
            select: { version: true, deleted: true }
        });

        if (!current) {
            throw new Error(`Registro con ID ${id} no encontrado`);
        }

        if (current.deleted) {
            throw new Error(`El registro con ID ${id} ya está marcado como eliminado`);
        }

        const updateData: any = {
            where: {
                [cfg.idField!]: idValue,
                version: current.version  // Incluir versión para optimistic locking
            },
            data: { deleted: true },
        };

        // Solo agregar select/include si están definidos
        if (cfg.select) updateData.select = cfg.select;
        if (cfg.include) updateData.include = cfg.include;

        // Usar cliente directo para evitar problemas con el interceptor
        const directPrisma = getPrismaClient();

        // Mapear nombres de recursos a modelos de Prisma
        const modelMap: Record<string, string> = {
            'countries': 'country',
            'players': 'player',
            'locations': 'location',
            'tournaments': 'tournament',
            'rulesets': 'ruleset',
            'uma': 'uma',
            'seasons': 'season',
            'rate-configs': 'rateConfig',
            'dan-configs': 'danConfig',
            'season-configs': 'seasonConfig',
            'email-accounts': 'emailAccount',
            'users': 'user'
        };

        const modelName = modelMap[resource] || resource.charAt(0).toLowerCase() + resource.slice(1);
        const directModel = (directPrisma as any)[modelName];

        console.log(`🔍 Using direct model for delete: ${modelName}`);

        const deleted = await directModel.update(updateData);

        console.log(`✅ Successfully deleted ${resource} ${id}`);
        return NextResponse.json({ success: true, data: deleted });
    } catch (err: any) {
        console.error(`❌ Error deleting ${resource} ${id}:`, err);
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


