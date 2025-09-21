'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
    showInfo?: boolean;
    compact?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
    showInfo = true,
    compact = false,
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generar números de página a mostrar
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = compact ? 5 : 7;

        if (totalPages <= maxVisible) {
            // Mostrar todas las páginas si son pocas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para mostrar páginas con elipsis
            pages.push(1);

            if (currentPage > 4) {
                pages.push('ellipsis');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 3) {
                pages.push('ellipsis');
            }

            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    if (totalPages <= 1) return null;

    return (
        <nav
            className={cn("flex items-center justify-between", className)}
            aria-label="Paginación de ranking"
        >
            {/* Información de elementos mostrados */}
            {showInfo && (
                <div className="text-sm text-muted-foreground">
                    Mostrando {startItem.toLocaleString('es-AR')}–{endItem.toLocaleString('es-AR')} de {totalItems.toLocaleString('es-AR')}
                </div>
            )}

            {/* Controles de paginación */}
            <div className="flex items-center space-x-1">
                {/* Botón anterior */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                    {pageNumbers.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <div key={`ellipsis-${index}`} className="px-2 py-1">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                            );
                        }

                        const isCurrentPage = page === currentPage;

                        return (
                            <Button
                                key={page}
                                variant={isCurrentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                aria-label={`Página ${page}`}
                                aria-current={isCurrentPage ? "page" : undefined}
                                className={cn(
                                    "h-8 w-8 p-0",
                                    isCurrentPage && "bg-brand-500 text-white hover:bg-brand-600"
                                )}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                {/* Botón siguiente */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Página siguiente"
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}
