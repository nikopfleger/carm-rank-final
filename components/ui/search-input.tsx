import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchInputProps {
    placeholder?: string;
    value: string;
    onChange(value: string): void;
    onClear?: () => void;
    className?: string;
    debounceMs?: number;
    showClearButton?: boolean;
    autoFocus?: boolean;
}

export function SearchInput({
    placeholder = "Buscar...",
    value,
    onChange,
    onClear,
    className,
    debounceMs = 300,
    showClearButton = true,
    autoFocus = false,
}: SearchInputProps) {
    const [inputValue, setInputValue] = useState(value);

    // Debounce del input
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(inputValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [inputValue, onChange, debounceMs]);

    // Sincronizar con value externo
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Atajos de teclado / para enfocar y Esc para limpiar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Solo si no estamos en un input/textarea
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    const input = document.querySelector('[data-search-input]') as HTMLInputElement;
                    if (input) {
                        input.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Manejar atajos dentro del input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape' && inputValue) {
            e.preventDefault();
            handleClear();
        }
    };

    const handleClear = () => {
        setInputValue('');
        onClear?.();
    };

    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                data-search-input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 h-9"
                autoFocus={autoFocus}
                aria-label="Buscar jugadores"
            />
            {showClearButton && inputValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpiar búsqueda"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {/* Indicador de atajo */}
            {!inputValue && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground border border-border/30 rounded px-1.5 h-5 flex items-center pointer-events-none">
                    /
                </kbd>
            )}
        </div>
    );
}
