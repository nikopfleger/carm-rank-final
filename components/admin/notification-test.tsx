'use client';

import { useNotifications } from '@/components/providers/notification-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useErrorHandler } from '@/hooks/use-error-handler';

export function NotificationTest() {
    const { handleError, handleSuccess, handleWarning, handleInfo } = useErrorHandler();
    const { addNotification } = useNotifications();

    const testSuccess = () => {
        handleSuccess('Operación completada exitosamente', 'Éxito');
    };

    const testError = () => {
        handleError('Este es un error de prueba', 'Error de Prueba');
    };

    const testCriticalError = () => {
        handleError({
            status: 500,
            message: 'Error crítico del servidor',
            code: 'INTERNAL_SERVER_ERROR'
        }, 'Error Crítico');
    };

    const testWarning = () => {
        handleWarning('Esta es una advertencia importante', 'Advertencia');
    };

    const testInfo = () => {
        handleInfo('Esta es información útil para el usuario', 'Información');
    };

    const testCustomNotification = () => {
        addNotification({
            type: 'success',
            title: 'Notificación Personalizada',
            message: 'Esta es una notificación con acción personalizada',
            duration: 0, // No se auto-elimina
            action: {
                label: 'Ver Detalles',
                onClick: () => {
                    console.log('Acción personalizada ejecutada');
                    handleInfo('Acción ejecutada correctamente');
                }
            }
        });
    };

    return (
        <Card className="p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">🧪 Prueba del Sistema de Notificaciones</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button onClick={testSuccess} variant="default" className="bg-green-600 hover:bg-green-700">
                    ✅ Éxito
                </Button>
                <Button onClick={testError} variant="destructive">
                    ❌ Error
                </Button>
                <Button onClick={testCriticalError} variant="destructive" className="bg-red-800 hover:bg-red-900">
                    🚨 Error Crítico
                </Button>
                <Button onClick={testWarning} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                    ⚠️ Advertencia
                </Button>
                <Button onClick={testInfo} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    ℹ️ Información
                </Button>
                <Button onClick={testCustomNotification} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                    🎯 Personalizada
                </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
                Las notificaciones aparecerán en la esquina inferior izquierda.
                Los errores críticos incluyen un botón para ver la consola.
            </p>
        </Card>
    );
}
