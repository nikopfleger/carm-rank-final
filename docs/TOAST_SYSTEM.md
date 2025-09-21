# 🍞 Sistema de Notificaciones Toast

## 📋 Descripción General

El sistema de toasts proporciona notificaciones no intrusivas para informar a los usuarios sobre el estado de las operaciones, errores y éxitos en la aplicación. Está integrado con un sistema de manejo de errores global y un boundary de errores para capturar errores no manejados.

## 🏗️ Arquitectura

### Componentes Principales

1. **`NotificationProvider`** - Context provider que maneja el estado global de notificaciones
2. **`useErrorHandler`** - Hook personalizado para manejo estandarizado de errores
3. **`useGlobalErrorBoundary`** - Hook para capturar errores no manejados
4. **`ErrorBoundaryWrapper`** - Componente wrapper para el boundary de errores

### Flujo de Datos

```
Usuario → Acción → API Call → useErrorHandler → NotificationProvider → Toast UI
```

## 🚀 Uso Básico

### 1. Importar el Hook

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";
```

### 2. Usar en Componente

```typescript
export function MyComponent() {
  const { handleError, handleSuccess, handleWarning, handleInfo } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        handleSuccess('Operación completada exitosamente', 'Éxito');
      } else {
        const error = await response.json();
        handleError(error, 'Enviar datos');
      }
    } catch (error) {
      handleError(error, 'Enviar datos');
    }
  };

  return (
    <button onClick={handleSubmit}>
      Enviar
    </button>
  );
}
```

## 🎯 Tipos de Notificaciones

### 1. Éxito (`handleSuccess`)
```typescript
handleSuccess('Mensaje de éxito', 'Título opcional');
```

### 2. Error (`handleError`)
```typescript
handleError(error, 'Contexto de la operación');
```

### 3. Advertencia (`handleWarning`)
```typescript
handleWarning('Mensaje de advertencia', 'Título opcional');
```

### 4. Información (`handleInfo`)
```typescript
handleInfo('Mensaje informativo', 'Título opcional');
```

## 🔧 Configuración Avanzada

### Notificaciones Personalizadas

```typescript
import { useNotifications } from "@/components/providers/notification-provider";

export function MyComponent() {
  const { addNotification } = useNotifications();

  const showCustomNotification = () => {
    addNotification({
      type: 'success',
      title: 'Título personalizado',
      message: 'Mensaje personalizado',
      duration: 10000, // 10 segundos
      action: {
        label: 'Ver Detalles',
        onClick: () => {
          // Acción personalizada
        }
      }
    });
  };
}
```

## 🎨 Personalización Visual

### Colores por Tipo

- **Éxito**: Verde (`bg-green-50`, `border-green-200`)
- **Error**: Rojo (`bg-red-50`, `border-red-200`)
- **Advertencia**: Amarillo (`bg-yellow-50`, `border-yellow-200`)
- **Información**: Azul (`bg-blue-50`, `border-blue-200`)

### Posicionamiento

Las notificaciones aparecen en la esquina inferior izquierda (`bottom-4 left-4`) con un z-index alto (`z-50`).

## 🛡️ Manejo de Errores

### Errores Críticos

Los errores con status >= 500 o código `INTERNAL_SERVER_ERROR` se marcan como críticos y:
- Duran más tiempo (10 segundos vs 5 segundos)
- Incluyen un botón "Ver Consola" para más detalles
- Muestran un mensaje genérico para el usuario

### Errores de API

```typescript
// El hook maneja automáticamente diferentes tipos de errores
handleError({
  status: 403,
  message: 'No tienes permisos',
  code: 'FORBIDDEN'
}, 'Operación de usuario');
// Resultado: "Sin Permisos - Operación de usuario"
```

### Errores de Red

```typescript
handleError(new Error('Network error'), 'Cargar datos');
// Resultado: "Error - Cargar datos"
```

## 🔄 Integración con useEffect

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      // Procesar datos
    } catch (error) {
      handleError(error, 'Cargar datos');
    }
  };

  loadData();
}, [handleError]); // Importante: incluir handleError en las dependencias
```

## 🧪 Testing

### Componente de Prueba

Se incluye un componente de prueba en `components/admin/notification-test.tsx` que permite probar todos los tipos de notificaciones:

```typescript
import { NotificationTest } from "@/components/admin/notification-test";

// Usar en cualquier página para probar
<NotificationTest />
```

## 📝 Mejores Prácticas

### 1. Contexto Descriptivo
```typescript
// ✅ Bueno
handleError(error, 'Guardar configuración de usuario');

// ❌ Malo
handleError(error, 'Error');
```

### 2. Mensajes Específicos
```typescript
// ✅ Bueno
handleSuccess('Usuario creado exitosamente', 'Creación exitosa');

// ❌ Malo
handleSuccess('OK');
```

### 3. Manejo de Estados de Carga
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // Operación
    handleSuccess('Operación exitosa');
  } catch (error) {
    handleError(error, 'Operación');
  } finally {
    setLoading(false);
  }
};
```

### 4. Dependencias de useEffect
```typescript
// ✅ Siempre incluir handleError en las dependencias
useEffect(() => {
  // Lógica
}, [handleError, otherDeps]);
```

## 🚨 Errores Comunes

### 1. Olvidar Dependencias
```typescript
// ❌ Problema: handleError no está en las dependencias
useEffect(() => {
  handleError(error, 'context');
}, []); // Falta handleError

// ✅ Solución
useEffect(() => {
  handleError(error, 'context');
}, [handleError]);
```

### 2. No Manejar Errores de API
```typescript
// ❌ Problema: Solo maneja errores de red
try {
  const response = await fetch('/api');
  const data = await response.json(); // Puede fallar
} catch (error) {
  handleError(error, 'context');
}

// ✅ Solución: Manejar ambos casos
try {
  const response = await fetch('/api');
  if (response.ok) {
    const data = await response.json();
    // Procesar datos
  } else {
    const error = await response.json();
    handleError(error, 'context');
  }
} catch (error) {
  handleError(error, 'context');
}
```

## 🔮 Futuras Mejoras

1. **Persistencia**: Guardar notificaciones en localStorage
2. **Agrupación**: Agrupar notificaciones similares
3. **Sonidos**: Añadir sonidos para diferentes tipos
4. **Animaciones**: Mejorar las animaciones de entrada/salida
5. **Temas**: Soporte para temas personalizados

## 📚 Referencias

- [React Context API](https://reactjs.org/docs/context.html)
- [Custom Hooks](https://reactjs.org/docs/hooks-custom.html)
- [Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Toast UI Patterns](https://ui-patterns.com/patterns/toast-notifications)
