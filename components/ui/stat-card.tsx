'use client';

import { BaseStatCard, BaseStatCardProps } from './base-stat-card';

interface StatCardProps extends BaseStatCardProps {
    // StatCard es exactamente igual a BaseStatCard
    // Solo mantenemos la interfaz para compatibilidad
}

export function StatCard(props: StatCardProps) {
    return <BaseStatCard {...props} />;
}
