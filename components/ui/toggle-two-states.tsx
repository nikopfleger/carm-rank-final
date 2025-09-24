import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToggleTwoStatesProps {
    on: boolean;
    onLabel: string;
    offLabel: string;
    onChange(on: boolean): void;
    className?: string;
    size?: 'sm' | 'md';
    disabled?: boolean;
    title?: string;
}

export function ToggleTwoStates({
    on,
    onLabel,
    offLabel,
    onChange,
    className,
    size = 'md',
    disabled = false,
    title,
}: ToggleTwoStatesProps) {
    const height = size === 'sm' ? 'h-8' : 'h-9';
    const padding = size === 'sm' ? 'px-3' : 'px-4';

    return (
        <div className={cn(
            "inline-flex rounded-full border border-border/30 bg-muted/50 p-0.5",
            className
        )}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(!on)}
                disabled={disabled}
                title={title}
                className={cn(
                    "rounded-full transition-all duration-200",
                    height,
                    padding,
                    on
                        ? "bg-background text-foreground shadow-sm border border-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
                aria-pressed={on}
                aria-expanded={on}
                aria-label={`${on ? 'Desactivar' : 'Activar'} ${on ? onLabel : offLabel}`}
            >
                {on ? onLabel : offLabel}
            </Button>
        </div>
    );
}
