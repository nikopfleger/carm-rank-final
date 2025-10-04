import { getResource } from '@/lib/abm/registry';
import { getPrismaClient } from '@/lib/database/connection';
import { serializeBigInt } from '@/lib/serialize-bigint';
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

        return NextResponse.json({ success: true, data: serializeBigInt(row) });
    } catch (err: any) {
        // Prisma known errors
        const code: string | undefined = err?.code;
        if (code === 'P2002') {
            // Unique constraint failed
            const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(',') : err?.meta?.target;
            return NextResponse.json({ success: false, error: 'Unique constraint failed', target }, { status: 409 });
        }
        if (code === 'P2025') {
            return NextResponse.json({ success: false, error: 'Registro no encontrado para actualizar' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: err?.message || 'Error', code, meta: err?.meta }, { status: 500 });
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
        console.log(`[ABM][PATCH] ${resource}/${id}`, body);

        const data = cfg.mapUpdate ? cfg.mapUpdate(body) : body;

        // Manejar diferentes tipos de ID (String vs Number)
        const idValue = resource === 'users' ? id : Number(id);
        // Validación genérica de unicidad (excluyendo el propio registro)
        if (cfg.uniqueFields && cfg.uniqueFields.length > 0) {
            for (const field of cfg.uniqueFields) {
                if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                    const exists = await cfg.model.findFirst({
                        where: {
                            [field]: data[field],
                            NOT: { [cfg.idField!]: idValue },
                        },
                    });
                    if (exists) {
                        return NextResponse.json({ success: false, error: `${field} ya está en uso` }, { status: 400 });
                    }
                }
            }
        }

        // Optimistic locking: requerimos 'version' en el WHERE
        const versionInBody = (data as any)?.version;
        if (versionInBody === undefined || versionInBody === null || Number.isNaN(Number(versionInBody))) {
            return NextResponse.json({ success: false, error: `[${resource.slice(0, 1).toUpperCase() + resource.slice(1)}] Falta 'version' en WHERE para optimistic locking. Debe incluir la versión esperada del registro.` }, { status: 400 });
        }
        // Evitar que Prisma intente setear version manualmente (lo maneja el interceptor)
        const { version, ...dataWithoutVersion } = data as any;

        const updated = await cfg.model.update({
            where: { [cfg.idField!]: idValue, version: Number(versionInBody) },
            data: dataWithoutVersion,
            select: cfg.select,
            include: cfg.include,
        });
        console.log(`[ABM][PATCH] OK ${resource}/${id}`);

        return NextResponse.json({ success: true, data: serializeBigInt(updated) });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}

// Aceptar PUT como alias de PATCH para compatibilidad con clientes existentes
export async function PUT(
    request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    console.log(`[ABM][PUT] hit`);
    return PATCH(request, context);
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
        return NextResponse.json({ success: true, data: serializeBigInt(deleted) });
    } catch (err: any) {
        console.error(`❌ Error deleting ${resource} ${id}:`, err);
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


