# Manejo de Concurrencia y Versionado

## Problema

El error "Row was updated or deleted by another transaction" ocurre cuando:

1. **Dos usuarios editan el mismo registro simultáneamente**
2. **El versionado no está siendo verificado correctamente**
3. **No hay optimistic locking implementado**

## Solución Implementada

### 1. **Optimistic Locking Forzado con Verificación de Versión**

El `audit-interceptor.ts` ahora **EXIGE** optimistic locking en todas las operaciones:

```typescript
// Helper para acceder al delegate dinámico del modelo
function delegateOf(model: string, prisma: PrismaClient) {
    const lc = model.charAt(0).toLowerCase() + model.slice(1);
    return (prisma as any)[lc];
}

// Soft-delete automático en todas las lecturas
async findFirst({ args, query, model }) {
    if (EXCLUDED_MODELS.includes(model)) {
        return query(args);
    }

    // Agregar filtro deleted: false para soft-delete
    const where = (args as any).where || {};
    (args as any).where = {
        ...where,
        deleted: false,
    };

    return query(args);
}

// update FORZADO con optimistic locking
async update({ args, query, model }) {
    const { where, data } = args as any;

    // FORZAR optimistic locking: exigir que toda update lleve version en el where
    if (!('version' in where)) {
        throw new Error(`[${model}] Falta 'version' en WHERE para optimistic locking. Debe incluir la versión esperada del registro.`);
    }

    // Convertir update -> updateMany para poder chequear count
    const res = await d.updateMany({
        where,
        data: { 
            ...data, 
            version: { increment: 1 },
            updatedAt: audit.timestamp,
            updatedBy: audit.userId,
            updatedIp: audit.userIp,
        }
    });

    if (res.count === 0) {
        // Conflict: nadie matcheó id+version
        const err: any = new Error("OPTIMISTIC_LOCK");
        err.code = "OPTIMISTIC_LOCK";
        err.meta = { current };
        throw err;
    }

    return d.findFirst({ where: { id: where.id } });
}
```

### 2. **Manejo de Errores de Optimistic Lock**

Los endpoints ABM ahora detectan y manejan errores de optimistic lock específicamente:

```typescript
// app/api/abm/dan-configs/[id]/route.ts
// Extraer versión del body y pasarla en el WHERE
const { version, ...updateData } = body;

// El interceptor ahora EXIGE que la versión esté en el WHERE
const danConfig = await prisma.danConfig.update({
    where: { 
        id,
        version: version // Versión esperada para optimistic locking
    },
    data: {
        ...updateData,
        rank: body.rank,
        sanma: body.sanma,
        // ... otros campos
    }
});

// Manejo de errores específicos
catch (error) {
    if (isOptimisticLockError(error)) {
        const current = (error as any).meta?.current;
        return NextResponse.json({
            success: false,
            error: `El registro fue modificado por otro usuario. Versión actual: ${current?.version}. ¿Desea actualizar con los datos más recientes?`,
            code: 'OPTIMISTIC_LOCK',
            currentVersion: current?.version,
            lastModified: current?.updatedAt
        }, { status: 409 });
    }
}
```

### 3. **Frontend con Manejo de Optimistic Lock**

Los hooks ABM detectan errores de optimistic lock y muestran mensajes específicos:

```typescript
// hooks/use-abm-operations.ts
const update = useCallback(async (id: number, data: any) => {
    try {
        const result = await abmService.updateCountry(id, data);
        return result;
    } catch (error: any) {
        // Manejar errores de optimistic lock específicamente
        if (handleOptimisticLockError(error, 'Actualizar país', error.response?.data)) {
            return; // El error ya fue manejado
        }
        
        // Manejar otros errores de concurrencia
        if (handleConcurrencyError(error, 'Actualizar país')) {
            return; // El error ya fue manejado
        }
        
        handleError(error, 'Actualizar país');
    }
}, [handleConcurrencyError, handleOptimisticLockError]);
```

## Características del Sistema

### ✅ **Retry Automático**
- **3 reintentos** por defecto
- **Delay exponencial** con jitter
- **Detección inteligente** de errores de concurrencia

### ✅ **Optimistic Locking**
- **Verificación de versión** antes de actualizar
- **Incremento automático** de versión
- **Detección de conflictos** de versión

### ✅ **Mensajes de Error Específicos**
- **Frontend**: "El registro fue modificado por otro usuario. Por favor, recarga la página e intenta nuevamente."
- **Backend**: Status 409 (Conflict) con código específico
- **Logs**: Información detallada para debugging

### ✅ **Transacciones Seguras**
- **Rollback automático** en caso de error
- **Consistencia garantizada** en operaciones complejas
- **Manejo de deadlocks**

### ✅ **Optimistic Locking Forzado**
- **EXIGE versión en WHERE** para todas las operaciones update
- **Previene errores de concurrencia** automáticamente
- **Soft-delete automático** en todas las lecturas
- **Error claro** si falta la versión: `"Falta 'version' en WHERE para optimistic locking"`

### ✅ **Simplificación en ABM**
- **No necesitas `handleConcurrencyError`** en endpoints ABM
- **El interceptor maneja todo automáticamente**
- **Solo necesitas pasar `version` en el WHERE**
- **Manejo de errores con `isOptimisticLockError`** y `isConcurrencyError`

## Uso en el Código

### Backend (API Routes) con Optimistic Locking

```typescript
import { isConcurrencyError, isOptimisticLockError } from '@/lib/database/concurrency-handler';

export async function PUT(request: NextRequest) {
    try {
        const { version, ...updateData } = await request.json();
        
        // El interceptor EXIGE que la versión esté en el WHERE
        const result = await prisma.model.update({
            where: { 
                id,
                version: version // Versión esperada para optimistic locking
            },
            data: {
                ...updateData
            }
        });
        
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        // Manejar errores de optimistic lock específicamente
        if (isOptimisticLockError(error)) {
            const current = (error as any).meta?.current;
            return NextResponse.json({
                success: false,
                error: `El registro fue modificado por otro usuario. Versión actual: ${current?.version}. ¿Desea actualizar con los datos más recientes?`,
                code: 'OPTIMISTIC_LOCK',
                currentVersion: current?.version,
                lastModified: current?.updatedAt
            }, { status: 409 });
        }
        
        // Manejar otros errores de concurrencia
        if (isConcurrencyError(error)) {
            return NextResponse.json({
                success: false,
                error: 'Conflicto de concurrencia',
                code: 'CONCURRENCY_ERROR'
            }, { status: 409 });
        }
        throw error;
    }
}
```

### Frontend (Hooks)

```typescript
import { useConcurrencyErrorHandler } from '@/hooks/use-concurrency-error-handler';

export function useMyOperations() {
    const { handleConcurrencyError } = useConcurrencyErrorHandler();
    
    const update = useCallback(async (id: number, data: any) => {
        try {
            return await api.update(id, data);
        } catch (error) {
            if (handleConcurrencyError(error, 'Actualizar registro')) {
                return; // Error manejado
            }
            throw error;
        }
    }, [handleConcurrencyError]);
}
```

## Configuración

### Variables de Entorno

```env
# Número máximo de reintentos (opcional, default: 3)
CONCURRENCY_MAX_RETRIES=3

# Delay base en ms (opcional, default: 100)
CONCURRENCY_BASE_DELAY=100
```

### Personalización

```typescript
// Retry personalizado
await handleConcurrencyError(
    () => myOperation(),
    maxRetries: 5,        // 5 reintentos
    baseDelayMs: 200      // 200ms base delay
);

// Verificación de versión específica
await updateWithVersionCheck(
    prisma,
    'MyModel',
    { id: 123 },
    { name: 'New Name' },
    expectedVersion: 5
);
```

## Monitoreo

### Logs de Concurrencia

```
⚠️ Error de concurrencia en intento 1/3, reintentando en 150ms...
⚠️ Error de concurrencia en intento 2/3, reintentando en 300ms...
✅ Operación completada exitosamente en intento 3
```

### Métricas

- **Tasa de errores de concurrencia**
- **Tiempo promedio de retry**
- **Número de reintentos por operación**

## Beneficios

1. **🛡️ Prevención de Pérdida de Datos**: Los conflictos se resuelven automáticamente
2. **🔄 Experiencia de Usuario Mejorada**: Retry transparente sin intervención del usuario
3. **📊 Visibilidad**: Logs y métricas detalladas para debugging
4. **⚡ Performance**: Delay exponencial evita sobrecarga del sistema
5. **🔒 Seguridad**: Verificación de versión previene actualizaciones incorrectas

## Casos de Uso Comunes

### 1. **Edición Simultánea de Configuraciones**
- Dos admins editan la misma configuración DAN
- Sistema detecta conflicto y reintenta automáticamente
- Usuario ve mensaje claro si persiste el conflicto

### 2. **Aprobación de Juegos**
- Múltiples validadores procesan el mismo juego
- Transacciones seguras previenen duplicados
- Rollback automático en caso de error

### 3. **Actualización de Rankings**
- Cálculos concurrentes de rankings
- Optimistic locking previene inconsistencias
- Invalidación de caché coordinada
