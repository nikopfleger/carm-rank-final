import { prisma } from '@/lib/database/client';

type ResourceConfig = {
    model: any;
    idField?: string;
    searchable?: string[];
    searchableNumeric?: string[];
    select?: any;
    include?: any;
    orderBy?: any;
    mapCreate?: (data: any) => any;
    mapUpdate?: (data: any) => any;
};

export const registry: Record<string, ResourceConfig> = {
    countries: {
        model: prisma.country,
        searchable: ['isoCode', 'fullName', 'nationality'],
        orderBy: { id: 'asc' },
    },
    players: {
        model: prisma.player,
        searchable: ['nickname', 'fullname'],
        searchableNumeric: ['playerNumber'],
        include: {
            country: { select: { id: true, fullName: true } },
            onlineUsers: { where: { deleted: false }, select: { id: true, platform: true, username: true, idOnline: true, isActive: true } }
        },
        orderBy: { id: 'asc' },
    },
    locations: {
        model: prisma.location,
        searchable: ['name', 'address', 'city', 'country'],
        orderBy: { id: 'asc' },
    },
    tournaments: {
        model: prisma.tournament,
        searchable: ['name', 'description'],
        include: { season: { select: { id: true, name: true } }, location: { select: { id: true, name: true } } },
        orderBy: { id: 'asc' },
    },
    rulesets: {
        model: prisma.ruleset,
        searchable: ['name'],
        include: { uma: true },
        orderBy: { id: 'asc' },
    },
    uma: {
        model: prisma.uma,
        searchable: ['name'],
        orderBy: { id: 'asc' },
    },
};

export function getResource(resource: string): ResourceConfig {
    const cfg = registry[resource];
    if (!cfg) throw new Error(`Unknown resource: ${resource}`);
    return { idField: 'id', ...cfg };
}


