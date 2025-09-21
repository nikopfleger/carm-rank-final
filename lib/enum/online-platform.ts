export enum OnlinePlatform {
    MAHJONG_SOUL = 'MAHJONG_SOUL',
    TENHOU = 'TENHOU',
    RIICHI_CITY = 'RIICHI_CITY'
}

export const ONLINE_PLATFORM_LABELS: Record<OnlinePlatform, string> = {
    [OnlinePlatform.MAHJONG_SOUL]: 'Mahjong Soul',
    [OnlinePlatform.TENHOU]: 'Tenhou',
    [OnlinePlatform.RIICHI_CITY]: 'Riichi City'
};

export const ONLINE_PLATFORM_OPTIONS = Object.entries(ONLINE_PLATFORM_LABELS).map(([value, label]) => ({
    value: value as OnlinePlatform,
    label
}));