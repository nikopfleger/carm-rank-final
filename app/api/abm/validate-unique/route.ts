import { getResource } from '@/lib/abm/registry';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { NextResponse } from 'next/server';

// Fallback legacy endpoint: /api/abm/validate-unique?resource=players&field=...&value=...&excludeId=...
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const resource = url.searchParams.get('resource');
        const field = url.searchParams.get('field');
        const value = url.searchParams.get('value');
        const excludeId = url.searchParams.get('excludeId');

        if (!resource || !field || value === null || value === undefined) {
            return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
        }

        const cfg = getResource(resource);
        if (!cfg.uniqueFields || !cfg.uniqueFields.includes(field)) {
            return NextResponse.json({ success: true, exists: false });
        }

        const where: any = { [field]: isNaN(Number(value)) ? value : Number(value) };
        if (excludeId) where.NOT = { [cfg.idField!]: isNaN(Number(excludeId)) ? excludeId : Number(excludeId) };

        const exists = await runWithRequestContextAsync({ includeDeleted: true }, async () => {
            return cfg.model.findFirst({ where });
        });
        return NextResponse.json({ success: true, exists: !!exists });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'Error' }, { status: 500 });
    }
}


