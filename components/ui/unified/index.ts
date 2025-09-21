// Exportaciones centralizadas del sistema de componentes unificados
// Este archivo sirve como punto único de importación para todos los componentes unificados

// Estilos y utilidades
export { getPositionColor, getSemanticColor, getWinRateColor, unifiedStyles } from '../unified-styles';

// Componentes base unificados
export {
    UnifiedButton,
    type UnifiedButtonProps,
    type UnifiedButtonVariant
} from '../unified-button';

export {
    UnifiedCard, UnifiedCardContent, UnifiedCardDescription, UnifiedCardFooter, UnifiedCardHeader,
    UnifiedCardTitle, type UnifiedCardHeaderProps, type UnifiedCardProps, type UnifiedCardVariant
} from '../unified-card';

export {
    UnifiedFieldGroup, UnifiedInput,
    UnifiedSelect, type UnifiedFieldGroupProps, type UnifiedInputProps,
    type UnifiedSelectProps
} from '../unified-input';

export {
    InfoChip, PositionBadge, StatBadge, UnifiedBadge, type InfoChipProps, type PositionBadgeProps, type StatBadgeProps, type UnifiedBadgeProps, type UnifiedBadgeSize, type UnifiedBadgeVariant
} from '../unified-badge';

export {
    ConfirmationModal,
    FormModal, UnifiedModal, type ConfirmationModalProps,
    type FormModalProps, type UnifiedModalProps, type UnifiedModalSize
} from '../unified-modal';

// Componentes especializados existentes
export {
    UnifiedPlayerCard,
    type UnifiedPlayerCardProps
} from '../unified-player-card';

export {
    BaseStatCard,
    type BaseStatCardProps,
    type StatCardColor
} from '../base-stat-card';

// Re-exportar componentes UI base cuando sea necesario
export { Badge } from '../badge';
export { Button } from '../button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../dialog';
export { Input } from '../input';
export { Label } from '../label';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

// Patrones de diseño comunes
export const commonPatterns = {
    // Layout patterns
    gridResponsive: {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    },

    // Spacing patterns
    spacing: {
        section: "space-y-6",
        form: "space-y-4",
        tight: "space-y-2",
        loose: "space-y-8"
    },

    // Container patterns
    container: {
        page: "container mx-auto px-4 py-8",
        section: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        narrow: "max-w-2xl mx-auto px-4",
        wide: "max-w-full px-4"
    },

    // Animation patterns
    animations: {
        fadeIn: "animate-in fade-in duration-200",
        slideIn: "animate-in slide-in-from-bottom-4 duration-300",
        scaleIn: "animate-in zoom-in-95 duration-200",
        hover: "hover:scale-105 transition-transform duration-200"
    }
} as const;

// Helpers para construcción de componentes
export const componentHelpers = {
    // Combinar clases con el sistema unificado
    combineWithUnified: (unifiedClass: string, customClass?: string) => {
        return customClass ? `${unifiedClass} ${customClass}` : unifiedClass;
    },

    // Generar props responsivas
    responsiveProps: (base: string, sm?: string, md?: string, lg?: string, xl?: string) => {
        let classes = base;
        if (sm) classes += ` sm:${sm}`;
        if (md) classes += ` md:${md}`;
        if (lg) classes += ` lg:${lg}`;
        if (xl) classes += ` xl:${xl}`;
        return classes;
    },

    // Generar variantes de color
    colorVariants: (baseColor: string) => ({
        50: `${baseColor}-50`,
        100: `${baseColor}-100`,
        200: `${baseColor}-200`,
        300: `${baseColor}-300`,
        400: `${baseColor}-400`,
        500: `${baseColor}-500`,
        600: `${baseColor}-600`,
        700: `${baseColor}-700`,
        800: `${baseColor}-800`,
        900: `${baseColor}-900`
    })
} as const;
