import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
    lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
    return (
        <div className={cn("animate-pulse", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"
                    style={{ width: `${100 - i * 10}%` }}
                />
            ))}
        </div>
    );
}

export function GameSheetSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header skeleton */}
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>

            {/* Table skeleton */}
            <div className="border rounded-lg overflow-hidden">
                <div className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex border-b last:border-b-0">
                            {Array.from({ length: 8 }).map((_, j) => (
                                <div
                                    key={j}
                                    className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 border-r last:border-r-0"
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary skeleton */}
            <div className="animate-pulse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
            </div>
        </div>
    );
}

// Skeleton genérico de página tipo dashboard: header + secciones
export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/5 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>

            {/* Row de stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                ))}
            </div>

            {/* Sección grande (gráfico/lista) */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
        </div>
    );
}

// Lista de cards esqueleto (para history/ranking)
export function CardListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="h-16 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
            ))}
        </div>
    );
}

// Skeleton específico para perfil de jugador
export function PlayerProfileSkeleton() {
    return (
        <div className="max-w-6xl mx-auto animate-pulse">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                        {/* Left side - Player info */}
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                            </div>
                        </div>

                        {/* Right side - Filters */}
                        <div className="flex space-x-4">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                <div className="flex space-x-2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                <div className="flex space-x-2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Player Info Card Skeleton */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    {/* Player name and basic info */}
                    <div className="mb-6">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    </div>

                    {/* Rank Progress Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
                        <div className="text-center">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-4" />
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mx-auto mb-4" />
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto" />
                        </div>
                    </div>

                    {/* Stats Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Dan Points Card */}
                        <div className="rounded-xl border border-purple-200 dark:border-purple-800 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            </div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        </div>

                        {/* Rate Points Card */}
                        <div className="rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            </div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        </div>

                        {/* Average Position Card */}
                        <div className="rounded-xl border border-green-200 dark:border-green-800 p-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                        </div>

                        {/* Season Points Card */}
                        <div className="rounded-xl border border-orange-200 dark:border-orange-800 p-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                    </div>

                    {/* Detailed Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart Card Skeleton */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        <div className="flex space-x-2">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                    </div>
                    <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
            </div>
        </div>
    );
}

// Skeleton específico para página de torneos
export function TournamentsPageSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="h-12 bg-white/20 rounded w-32 mx-auto mb-4" />
                        <div className="h-6 bg-white/20 rounded w-80 mx-auto" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-8">
                {/* Filter Section Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 justify-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                    </div>
                </div>

                {/* Próximos Torneos Section */}
                <div className="mb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                        </div>

                        {/* Tournaments Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                            <div className="flex flex-wrap gap-2">
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info sections */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-1" />
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Torneos Completados Section */}
                <div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                        </div>

                        {/* Completed Tournaments Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                            <div className="flex flex-wrap gap-2">
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info sections */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-1" />
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton específico para página de temporadas
export function SeasonsPageSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="h-12 bg-white/20 rounded w-32 mx-auto mb-4" />
                        <div className="h-6 bg-white/20 rounded w-80 mx-auto" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Title */}
                    <div className="mb-8">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    </div>

                    {/* Seasons Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                        <div>
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                        </div>
                                    </div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                </div>

                                {/* Date Range */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                                    </div>
                                </div>

                                {/* Rulesets */}
                                <div className="mb-6">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                                    <div className="flex flex-wrap gap-2">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton específico para tabla de ranking
export function RankTableSkeleton() {
    return (
        <div className="w-full space-y-6 px-3 sm:px-4 mx-auto max-w-6xl pb-24 lg:pb-0 animate-pulse">
            {/* Update info bar */}
            <div className="text-xs text-muted-foreground text-center py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
            </div>

            {/* Filters section */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30 py-6 rounded-xl">
                <div className="space-y-6">
                    {/* Main filters row */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                            {/* Player filter */}
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />

                            {/* Player count toggle */}
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded">
                                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-12" />
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                            </div>

                            {/* Ranking type toggle */}
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded">
                                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20" />
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                            </div>
                        </div>

                        {/* Search and view controls */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                        </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
                        </div>
                        <div className="text-center">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
                        </div>
                        <div className="text-center">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
                        </div>
                        <div className="text-center">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table skeleton */}
            <div className="space-y-2">
                {/* Table header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Jugador</div>
                    <div className="col-span-1 text-center">Pos.</div>
                    <div className="col-span-1 text-center">% Vic.</div>
                    <div className="col-span-1 text-center">Rate</div>
                    <div className="col-span-1 text-center">Rango</div>
                    <div className="col-span-1 text-center">Juegos</div>
                    <div className="col-span-2 text-center">Tendencia</div>
                    <div className="col-span-2 text-center">Acciones</div>
                </div>

                {/* Table rows */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4 hover:bg-card/80 transition-colors">
                        <div className="flex items-center justify-between">
                            {/* Mobile layout */}
                            <div className="md:hidden flex-1 space-y-3">
                                {/* Player info */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                    </div>
                                </div>

                                {/* Mobile stats grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                                    </div>
                                    <div className="text-center">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                                    </div>
                                </div>

                                {/* Mobile actions */}
                                <div className="flex gap-2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                </div>
                            </div>

                            {/* Desktop layout */}
                            <div className="hidden md:flex items-center gap-4 w-full">
                                {/* Player info */}
                                <div className="col-span-3 flex items-center gap-3 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="col-span-1 text-center">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                                </div>
                                <div className="col-span-1 text-center">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="flex gap-2 justify-center">
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex justify-center">
                <div className="flex items-center gap-2">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-10" />
                </div>
            </div>
        </div>
    );
}

// Skeleton específico para lista de validación de juegos
export function GameValidationListSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                        </div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                        </div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                        </div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
            </div>

            {/* Section header */}
            <div>
                <div className="mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
                </div>

                {/* Games list */}
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                            {/* Card header */}
                            <div className="p-6 pb-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                                        <div className="flex items-center gap-4">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                    </div>
                                </div>
                            </div>

                            {/* Card content */}
                            <div className="px-6 pb-6">
                                {/* Game info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                                    </div>
                                </div>

                                {/* Players list */}
                                <div className="space-y-2 mb-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <div key={j} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                                    <div>
                                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
                                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Image preview */}
                                <div className="mb-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}