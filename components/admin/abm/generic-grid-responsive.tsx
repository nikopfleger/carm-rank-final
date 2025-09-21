"use client";

import { useEffect, useState } from "react";
import { GenericGrid, GenericGridProps } from "./generic-grid";
import { GenericGridMobile } from "./generic-grid-mobile";

export function GenericGridResponsive(props: GenericGridProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Durante SSR o antes de que se determine el tamaño, mostrar la versión desktop
    if (!isClient) {
        return <GenericGrid {...props} />;
    }

    return isMobile ? <GenericGridMobile {...props} /> : <GenericGrid {...props} />;
}

// Re-exportar tipos para conveniencia
export type { GenericGridProps, GridAction, GridColumn } from "./generic-grid";

