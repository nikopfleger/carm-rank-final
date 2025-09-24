import { getResource } from '@/lib/abm/registry';
import { NextResponse } from 'next/server';

export async function GET(
    _request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    try {
        const { resource, id } = await context.params;
        const cfg = getResource(resource);

        const row = await cfg.model.findUnique({
            where: { [cfg.idField!]: Number(id) },
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

        const updated = await cfg.model.update({
            where: { [cfg.idField!]: Number(id) },
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
    try {
        const { resource, id } = await context.params;
        const cfg = getResource(resource);

        const deleted = await cfg.model.update({
            where: { [cfg.idField!]: Number(id) },
            data: { deleted: true },
            select: cfg.select,
            include: cfg.include,
        });

        return NextResponse.json({ success: true, data: deleted });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


