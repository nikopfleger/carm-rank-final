import { getResource } from '@/lib/abm/registry';
import { runWithRequestContextAsync } from '@/lib/request-context.server';
import { NextResponse } from 'next/server';

// Tipos mínimos para no depender de Prisma en tiempo de compilación
type GenericRow = Record<string, unknown>;

interface ResourceCfg {
    uniqueFields?: string[];
    // findMany devolverá objetos con al menos la key pedida en `select`
    model: {
        findMany: (args: {
            where?: Record<string, unknown>;
            select: Record<string, true>;
            orderBy?: Record<string, 'asc' | 'desc'>;
        }) => Promise<GenericRow[]>;
    };
}

export async function GET(
    request: Request,
    context: { params: Promise<{ resource: string }> } // si podés, cambiá esto por no-async params
) {
    try {
        const { resource } = await context.params;
        const cfg = getResource(resource) as ResourceCfg;

        const url = new URL(request.url);
        const field = url.searchParams.get('field');

        if (!field) {
            return NextResponse.json(
                { success: false, error: 'field requerido' },
                { status: 400 }
            );
        }

        if (!cfg.uniqueFields || !cfg.uniqueFields.includes(field)) {
            return NextResponse.json(
                { success: false, error: 'Campo no declarado como único' },
                { status: 400 }
            );
        }

        // Traemos solo el campo necesario, incluyendo eliminados (para considerar ocupados)
        const rows = await runWithRequestContextAsync({ includeDeleted: true }, async () => {
            return cfg.model.findMany({
                where: {},
                select: { [field]: true },
            });
        });

        // Normalizar -> número, deduplicar y ordenar numéricamente
        const values: number[] = Array.from(
            new Set(
                rows
                    .map((r: GenericRow) => {
                        const raw = r[field];
                        const num =
                            typeof raw === 'number' ? raw : Number(raw as unknown);
                        return Number.isFinite(num) ? num : NaN;
                    })
                    // type predicate para que TS sepa que quedan solo numbers válidos
                    .filter((n: number): n is number => Number.isFinite(n) && n > 0)
            )
        ).sort((a: number, b: number) => a - b);

        // Buscar primer entero positivo faltante (primer hueco)
        let expected = 1;
        for (const v of values) {
            if (v < expected) continue;
            if (v === expected) {
                expected++;
            } else {
                break; // encontramos hueco
            }
        }

        return NextResponse.json({ success: true, value: expected });
    } catch (err) {
        const msg =
            err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
