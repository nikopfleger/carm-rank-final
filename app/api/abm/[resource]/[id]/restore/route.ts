import { getResource } from '@/lib/abm/registry';
import { NextResponse } from 'next/server';

export async function POST(
    _request: Request,
    context: { params: Promise<{ resource: string; id: string }> }
) {
    try {
        const { resource, id } = await context.params;
        const cfg = getResource(resource);

        const restored = await cfg.model.update({
            where: { [cfg.idField!]: Number(id) },
            data: { deleted: false },
            select: cfg.select,
            include: cfg.include,
        });

        return NextResponse.json({ success: true, data: restored });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


