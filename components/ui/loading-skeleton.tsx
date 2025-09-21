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