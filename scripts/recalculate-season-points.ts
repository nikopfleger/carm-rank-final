import { prisma } from '../lib/database/client';

async function recalculateSeasonPoints() {
    console.log('🔄 Recalculando puntos de temporada...');

    try {
        // Obtener configuración de temporada por defecto
        const seasonConfig = await prisma.seasonConfig.findFirst({
            where: {
                isDefault: true,
                sanma: false // 4 jugadores
            }
        });

        if (!seasonConfig) {
            console.error('❌ No se encontró configuración de temporada por defecto');
            return;
        }

        console.log('📊 Configuración de temporada:', {
            firstPlace: seasonConfig.firstPlace,
            secondPlace: seasonConfig.secondPlace,
            thirdPlace: seasonConfig.thirdPlace,
            fourthPlace: seasonConfig.fourthPlace
        });

        // Obtener todos los rankings
        const rankings = await (prisma as any).playerRanking.findMany({
            where: {
                isSanma: false // 4 jugadores
            },
            include: {
                player: true
            }
        });

        console.log(`👥 Encontrados ${rankings.length} rankings para recalcular`);

        for (const ranking of rankings as any[]) {
            // Calcular puntos de temporada basándose en los contadores
            const seasonPoints =
                ((ranking.seasonFirstPlaceH || 0) * seasonConfig.firstPlace) +
                ((ranking.seasonSecondPlaceH || 0) * seasonConfig.secondPlace) +
                ((ranking.seasonThirdPlaceH || 0) * seasonConfig.thirdPlace) +
                ((ranking.seasonFourthPlaceH || 0) * (seasonConfig.fourthPlace ?? 0)) +
                ((ranking.seasonFirstPlaceT || 0) * seasonConfig.firstPlace) +
                ((ranking.seasonSecondPlaceT || 0) * seasonConfig.secondPlace) +
                ((ranking.seasonThirdPlaceT || 0) * seasonConfig.thirdPlace) +
                ((ranking.seasonFourthPlaceT || 0) * (seasonConfig.fourthPlace ?? 0));

            console.log(`🎯 ${ranking.player.nickname} (L${ranking.player.playerNumber}):`, {
                contadores: {
                    H: `${ranking.seasonFirstPlaceH || 0}/${ranking.seasonSecondPlaceH || 0}/${ranking.seasonThirdPlaceH || 0}/${ranking.seasonFourthPlaceH || 0}`,
                    T: `${ranking.seasonFirstPlaceT || 0}/${ranking.seasonSecondPlaceT || 0}/${ranking.seasonThirdPlaceT || 0}/${ranking.seasonFourthPlaceT || 0}`
                },
                puntosAnteriores: ranking.seasonPoints,
                puntosCalculados: seasonPoints,
                diferencia: seasonPoints - ranking.seasonPoints
            });

            // Actualizar solo si hay diferencia
            if (seasonPoints !== ranking.seasonPoints) {
                await (prisma as any).playerRanking.update({
                    where: {
                        id: ranking.id
                    },
                    data: {
                        seasonPoints: seasonPoints
                    }
                });
                console.log(`✅ Actualizado ${ranking.player.nickname}: ${ranking.seasonPoints} → ${seasonPoints}`);
            }
        }

        console.log('🎉 Recalculación completada');
    } catch (error) {
        console.error('❌ Error recalculando puntos de temporada:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recalculateSeasonPoints();
