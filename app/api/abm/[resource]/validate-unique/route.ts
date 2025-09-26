import { getResource } from '@/lib/abm/registry';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    context: { params: Promise<{ resource: string }> }
) {
    try {
        const { resource } = await context.params;
        const cfg = getResource(resource);

        const url = new URL(request.url);
        const field = url.searchParams.get('field');
        const value = url.searchParams.get('value');
        const excludeId = url.searchParams.get('excludeId');

        if (!field || value === null || value === undefined) {
            return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
        }

        // Si el recurso no declara el campo como único, responder neutro
        if (!cfg.uniqueFields || !cfg.uniqueFields.includes(field)) {
            return NextResponse.json({ success: true, exists: false });
        }

        const where: any = { [field]: isNaN(Number(value)) ? value : (field === 'playerNumber' ? Number(value) : value) };
        // Considerar soft delete
        where.deleted = false;

        if (excludeId) {
            where.NOT = { [cfg.idField!]: isNaN(Number(excludeId)) ? excludeId : Number(excludeId) };
        }

        const exists = await cfg.model.findFirst({ where });
        return NextResponse.json({ success: true, exists: !!exists });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


