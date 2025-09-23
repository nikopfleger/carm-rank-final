import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🧪 Testing database pooling...');

        // Realizar múltiples consultas simultáneas para probar el pooling
        const startTime = Date.now();

        const promises = Array.from({ length: 10 }, async (_, index) => {
            const queryStart = Date.now();

            // Consulta simple para probar la conexión
            const result = await prisma.$queryRaw`SELECT ${index} as query_number, NOW() as query_time`;

            const queryEnd = Date.now();
            return {
                queryNumber: index,
                queryTime: queryEnd - queryStart,
                result: (result as any)[0],
            };
        });

        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;

        // Verificar conteos de tablas principales
        const counts = await Promise.all([
            prisma.country.count(),
            prisma.player.count(),
            prisma.season.count(),
            prisma.game.count(),
        ]);

        const [countryCount, playerCount, seasonCount, gameCount] = counts;

        console.log('✅ Pooling test completed successfully');

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            poolingTest: {
                totalQueries: results.length,
                totalTime: `${totalTime}ms`,
                averageQueryTime: `${Math.round(results.reduce((sum, r) => sum + r.queryTime, 0) / results.length)}ms`,
                queries: results,
            },
            databaseStats: {
                countries: countryCount,
                players: playerCount,
                seasons: seasonCount,
                games: gameCount,
            },
        });
    } catch (error) {
        console.error('❌ Pooling test failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Pooling test failed',
                timestamp: new Date().toISOString(),
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
