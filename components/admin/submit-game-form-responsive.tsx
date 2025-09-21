"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";
import { ImprovedSubmitGameForm } from "./improved-submit-game-form";

export function SubmitGameFormResponsive() {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [forceDesktop, setForceDesktop] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Durante SSR, mostrar la versión desktop
    if (!isClient) {
        return <ImprovedSubmitGameForm />;
    }

    // Si el usuario fuerza desktop o está en desktop, mostrar versión completa
    if (forceDesktop || (!isMobile && !isTablet)) {
        return (
            <div>
                {(isMobile || isTablet) && (
                    <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Modo Desktop Activado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                Estás usando la versión completa del formulario. Puede ser más difícil de usar en dispositivos móviles.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setForceDesktop(false)}
                                className="text-xs"
                            >
                                <Smartphone className="w-3 h-3 mr-1" />
                                Cambiar a versión móvil
                            </Button>
                        </CardContent>
                    </Card>
                )}
                <ImprovedSubmitGameForm />
            </div>
        );
    }

    // Versión móvil/tablet simplificada
    return (
        <div>
            <Card className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        {isMobile ? <Smartphone className="w-4 h-4" /> : <Tablet className="w-4 h-4" />}
                        Versión {isMobile ? 'Móvil' : 'Tablet'} Simplificada
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                        Para una mejor experiencia en el envío de juegos, recomendamos usar un dispositivo con pantalla más grande.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setForceDesktop(true)}
                            className="text-xs"
                        >
                            <Monitor className="w-3 h-3 mr-1" />
                            Usar versión completa
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Versión simplificada del formulario */}
            <div className="space-y-4">
                <ImprovedSubmitGameForm />
            </div>
        </div>
    );
}
