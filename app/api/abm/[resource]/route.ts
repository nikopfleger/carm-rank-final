import { getResource } from '@/lib/abm/registry';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ resource: string }> }
) {
    try {
        const { resource } = await context.params;
        const cfg = getResource(resource);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const include = sp.get('includeDeleted') === 'true';
        const deletedParam = sp.get('deleted');
        const search = sp.get('search')?.trim();

        let where: any = {};
        // Caso de uso original: o "deleted=false" o nada
        if (deletedParam === 'false') where = { ...where, deleted: false };
        // Cuando includeDeleted=true, no agregamos deleted en where; lo maneja el interceptor

        if (search && (cfg.searchable?.length || cfg.searchableNumeric?.length)) {
            const or: any[] = [];
            if (cfg.searchable?.length) {
                or.push(...cfg.searchable.map((k) => ({ [k]: { contains: search, mode: 'insensitive' } })));
            }
            if (cfg.searchableNumeric?.length && /^\d+$/.test(search)) {
                const num = Number(search);
                for (const k of cfg.searchableNumeric) {
                    or.push({ [k]: Number.isNaN(num) ? undefined : num });
                }
            }
            if (or.length) where = { ...where, OR: or };
        }

        // Debug server-side
        console.debug('[ABM][GET] resource=%s includeDeleted=%s deletedParam=%s where=%o url=%s',
            resource, include, deletedParam, where, url.pathname + url.search);

        const rows = await runWithRequestContextAsync({ includeDeleted: include }, async () => {
            return cfg.model.findMany({
                where,
                select: cfg.select,
                include: cfg.include,
                orderBy: cfg.orderBy,
            });
        });

        console.debug('[ABM][GET] resource=%s results=%d', resource, rows.length);

        return NextResponse.json({ success: true, data: rows, total: rows.length });
    } catch (err: any) {
        console.error('ABM GET error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ resource: string }> }
) {
    try {
        const { resource } = await context.params;
        const cfg = getResource(resource);
        const body = await request.json();

        const data = cfg.mapCreate ? cfg.mapCreate(body) : body;

        // Validación genérica de unicidad (metadatos en registry)
        if (cfg.uniqueFields && cfg.uniqueFields.length > 0) {
            for (const field of cfg.uniqueFields) {
                if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                    const exists = await cfg.model.findFirst({ where: { [field]: data[field] } });
                    if (exists) {
                        return NextResponse.json({ success: false, error: `${field} ya está en uso` }, { status: 400 });
                    }
                }
            }
        }

        const created = await cfg.model.create({
            data,
            select: cfg.select,
            include: cfg.include,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (err: any) {
        console.error('ABM POST error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


