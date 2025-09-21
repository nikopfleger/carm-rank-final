import { useEffect, useRef } from "react";

/**
 * Hook que evita el doble disparo de useEffect en desarrollo (React StrictMode)
 * y proporciona AbortController para cancelar requests
 */
export function useEffectOnceDevSafe(effect: () => void | (() => void), deps: any[]) {
    const ranRef = useRef(false);

    useEffect(() => {
        if (ranRef.current) return; // evita el segundo run de StrictMode (solo DEV)
        ranRef.current = true;
        return effect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * Utility para setState solo si el valor realmente cambió
 * Evita renders extra que podrían re-encadenar otros efectos
 */
export function setIfChanged<T>(set: React.Dispatch<React.SetStateAction<T>>, next: T) {
    set(prev => (Object.is(prev, next) ? prev : next));
}
