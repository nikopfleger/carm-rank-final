import { prisma } from '@/lib/database/client';

// Helper para manejar fechas correctamente (evitar problemas de zona horaria)
const parseDate = (dateString: string): Date => {
    // Si la fecha viene como "2025-09-27", crear la fecha en zona horaria local
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // month es 0-indexed en JS
    }
    return new Date(dateString);
};

type ResourceConfig = {
    model: any;
    idField?: string;
    searchable?: string[];
    searchableNumeric?: string[];
    uniqueFields?: string[];
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
        uniqueFields: ['playerNumber', 'nickname'],
        mapCreate: (data: any) => {
            // Whitelist de columnas válidas
            const allowed: any = {
                nickname: undefined,
                fullname: undefined,
                countryId: undefined,
                playerNumber: undefined,
                birthday: undefined,
                version: undefined,
            };
            const clean: any = {};
            for (const k of Object.keys(allowed)) if (k in data) clean[k] = (data as any)[k];
            if (clean.playerNumber != null) clean.playerNumber = Number(clean.playerNumber);
            if (clean.countryId != null) clean.countryId = Number(clean.countryId);
            if (typeof clean.nickname === 'string') clean.nickname = clean.nickname.trim();
            if (typeof clean.fullname === 'string') clean.fullname = clean.fullname.trim();
            if (clean.birthday && typeof clean.birthday === 'string') clean.birthday = parseDate(clean.birthday);
            return clean;
        },
        mapUpdate: (data: any) => {
            // Whitelist de columnas válidas (+version para optimistic locking)
            const allowed: any = {
                nickname: undefined,
                fullname: undefined,
                countryId: undefined,
                playerNumber: undefined,
                birthday: undefined,
                version: undefined,
            };
            const clean: any = {};
            for (const k of Object.keys(allowed)) if (k in data) clean[k] = (data as any)[k];
            if (clean.playerNumber != null) clean.playerNumber = Number(clean.playerNumber);
            if (clean.countryId != null) clean.countryId = Number(clean.countryId);
            if (typeof clean.nickname === 'string') clean.nickname = clean.nickname.trim();
            if (typeof clean.fullname === 'string') clean.fullname = clean.fullname.trim();
            if (clean.birthday && typeof clean.birthday === 'string') clean.birthday = parseDate(clean.birthday);
            return clean;
        },
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
        include: {
            season: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
            tournamentResults: {
                where: { deleted: false },
                select: {
                    id: true,
                    position: true,
                    pointsWon: true,
                    prizeWon: true,
                    playerId: true,
                    player: {
                        select: {
                            id: true,
                            nickname: true,
                            fullname: true
                        }
                    }
                }
            }
        },
        orderBy: { id: 'asc' },
        mapCreate: (data: any) => {
            // Filtrar campos que no deben enviarse a Prisma
            const { id, createdAt, updatedAt, createdBy, createdIp, updatedBy, updatedIp, ...cleanData } = data;

            // Convertir fechas de string a Date
            if (data.startDate && typeof data.startDate === 'string') {
                cleanData.startDate = parseDate(data.startDate);
            }
            if (data.endDate && typeof data.endDate === 'string') {
                cleanData.endDate = parseDate(data.endDate);
            }

            // Convertir IDs de string a number
            if (data.locationId && typeof data.locationId === 'string') {
                cleanData.locationId = parseInt(data.locationId, 10);
            }
            if (data.seasonId && typeof data.seasonId === 'string') {
                cleanData.seasonId = parseInt(data.seasonId, 10);
            }

            // Normalizar tipo de torneo
            if (data.type && typeof data.type === 'string') {
                const typeMap: Record<string, 'INDIVIDUAL' | 'TEAM' | 'LEAGUE'> = {
                    individual: 'INDIVIDUAL',
                    team: 'TEAM',
                    league: 'LEAGUE',
                    INDIVIDUAL: 'INDIVIDUAL',
                    TEAM: 'TEAM',
                    LEAGUE: 'LEAGUE',
                };
                cleanData.type = typeMap[data.type.toLowerCase()] || data.type;
            }

            return cleanData;
        },
        mapUpdate: (data: any) => {
            // Filtrar campos que no deben enviarse a Prisma
            const { id, createdAt, updatedAt, createdBy, createdIp, updatedBy, updatedIp, ...cleanData } = data;

            // Convertir fechas de string a Date
            if (data.startDate && typeof data.startDate === 'string') {
                cleanData.startDate = parseDate(data.startDate);
            }
            if (data.endDate && typeof data.endDate === 'string') {
                cleanData.endDate = parseDate(data.endDate);
            }

            // Convertir IDs de string a number
            if (data.locationId && typeof data.locationId === 'string') {
                cleanData.locationId = parseInt(data.locationId, 10);
            }
            if (data.seasonId && typeof data.seasonId === 'string') {
                cleanData.seasonId = parseInt(data.seasonId, 10);
            }

            // Normalizar tipo de torneo
            if (data.type && typeof data.type === 'string') {
                const typeMap: Record<string, 'INDIVIDUAL' | 'TEAM' | 'LEAGUE'> = {
                    individual: 'INDIVIDUAL',
                    team: 'TEAM',
                    league: 'LEAGUE',
                    INDIVIDUAL: 'INDIVIDUAL',
                    TEAM: 'TEAM',
                    LEAGUE: 'LEAGUE',
                };
                cleanData.type = typeMap[data.type.toLowerCase()] || data.type;
            }

            return cleanData;
        }
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
    'rate-configs': {
        model: prisma.rateConfig,
        searchable: ['name'],
        orderBy: { id: 'asc' },
    },
    'dan-configs': {
        model: prisma.danConfig,
        searchable: ['rank'],
        orderBy: { id: 'asc' },
    },
    'season-configs': {
        model: prisma.seasonConfig,
        searchable: ['name'],
        include: { season: { select: { id: true, name: true } } },
        orderBy: { id: 'asc' },
    },
    'email-accounts': {
        model: prisma.emailAccount,
        searchable: ['name', 'fromAddress', 'server'],
        orderBy: { id: 'asc' },
    },
    'users': {
        model: prisma.user,
        searchable: ['name', 'email'],
        orderBy: { id: 'asc' },
    },
    'seasons': {
        model: prisma.season,
        searchable: ['name'],
        orderBy: { id: 'asc' },
    },
};

export function getResource(resource: string): ResourceConfig {
    const cfg = registry[resource];
    if (!cfg) throw new Error(`Unknown resource: ${resource}`);
    return { idField: 'id', ...cfg };
}


