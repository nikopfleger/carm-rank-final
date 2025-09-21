# Arquitectura Unificada del Sistema CARM

## Resumen

Este documento describe la arquitectura unificada implementada en el sistema CARM, incluyendo patrones de diseño, componentes reutilizables y mejores prácticas para el desarrollo.

## 🏗️ Estructura del Sistema Unificado

### 1. Modelos y Tipos (`lib/model/`)

**Archivo principal:** `lib/model/index.ts`

Centraliza todas las interfaces y tipos del modelo de datos:

```typescript
// Importación unificada
import type { 
  Player, 
  Game, 
  PlayerWithStats, 
  GameFormData 
} from '@/lib/model';
```

**Beneficios:**
- ✅ Punto único de importación
- ✅ Tipos extendidos para UI
- ✅ Interfaces de formularios
- ✅ Tipos de utilidad
- ✅ Compatibilidad con TypeScript strict

### 2. Sistema de Componentes Unificados (`components/ui/unified/`)

**Archivo principal:** `components/ui/unified/index.ts`

#### Componentes Base

| Componente | Propósito | Variantes |
|------------|-----------|-----------|
| `UnifiedButton` | Botones con estilos consistentes | `primary`, `secondary`, `approve`, `reject`, `delete` |
| `UnifiedCard` | Contenedores con diseño unificado | `default`, `elevated`, `flat`, `bordered`, `gradient` |
| `UnifiedInput` | Campos de entrada estandarizados | Con iconos, labels, errores |
| `UnifiedSelect` | Selectores con opciones | Con validación y estados |
| `UnifiedBadge` | Etiquetas y estados | `success`, `warning`, `danger`, `position` |
| `UnifiedModal` | Diálogos y modales | `sm`, `md`, `lg`, `xl`, `full` |

#### Componentes Especializados

| Componente | Uso |
|------------|-----|
| `ConfirmationModal` | Confirmaciones de acciones |
| `FormModal` | Formularios en modal |
| `PositionBadge` | Badges de posición en rankings |
| `StatBadge` | Estadísticas con colores semánticos |
| `InfoChip` | Información contextual |

### 3. Patrones de Diseño Comunes

#### Layout Patterns

```typescript
import { commonPatterns } from '@/components/ui/unified';

// Grids responsivos
className={commonPatterns.gridResponsive[3]} // 1-2-3 columnas

// Contenedores
className={commonPatterns.container.page} // Página completa
className={commonPatterns.container.section} // Sección
className={commonPatterns.container.narrow} // Contenido estrecho

// Espaciado
className={commonPatterns.spacing.section} // Entre secciones
className={commonPatterns.spacing.form} // En formularios
```

#### Responsive Patterns

```typescript
// Componentes adaptativos
<UnifiedFieldGroup columns={3} gap="md">
  <UnifiedInput label="Campo 1" />
  <UnifiedInput label="Campo 2" />
  <UnifiedInput label="Campo 3" />
</UnifiedFieldGroup>

// Breakpoints: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
```

## 🎨 Sistema de Estilos Unificado

### Colores Semánticos

```typescript
import { unifiedStyles, getSemanticColor } from '@/components/ui/unified';

// Colores automáticos basados en valores
const color = getSemanticColor(winRate, { good: 25, warning: 20 });
const positionColor = getPositionColor(avgPosition);
```

### Estilos Predefinidos

```typescript
// Botones con gradientes
className={unifiedStyles.primaryButton}
className={unifiedStyles.secondaryButton}

// Cards con efectos
className={unifiedStyles.card}

// Badges de posición
className={unifiedStyles.positionBadge(1)} // Oro, plata, bronce
```

## 📋 Componentes ABM Unificados

### Ejemplo de Implementación

```typescript
import { 
  UnifiedCard, 
  UnifiedButton, 
  FormModal,
  commonPatterns 
} from '@/components/ui/unified';

export function MyABMComponent() {
  return (
    <div className={commonPatterns.container.page}>
      <UnifiedCard variant="gradient">
        <UnifiedCardHeader
          icon={Users}
          actions={
            <UnifiedButton variant="primary" icon={Plus}>
              Agregar
            </UnifiedButton>
          }
        >
          <UnifiedCardTitle>Gestión de Datos</UnifiedCardTitle>
        </UnifiedCardHeader>
      </UnifiedCard>
    </div>
  );
}
```

### GenericGrid Mejorado

- ✅ **Responsive**: Desktop table + Mobile cards
- ✅ **Componentes unificados**: Botones, inputs, modales
- ✅ **Detección automática**: Cambia según tamaño de pantalla
- ✅ **Acciones consistentes**: Editar, eliminar, restaurar

## 🔄 Migración de Componentes Existentes

### Antes (Componente tradicional)

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function OldComponent() {
  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <div className="p-6">
        <Input placeholder="Buscar..." className="mb-4" />
        <Button className="bg-blue-500 hover:bg-blue-600">
          Acción
        </Button>
      </div>
    </Card>
  );
}
```

### Después (Componente unificado)

```typescript
import { 
  UnifiedCard, 
  UnifiedCardContent,
  UnifiedInput, 
  UnifiedButton 
} from '@/components/ui/unified';

export function NewComponent() {
  return (
    <UnifiedCard variant="elevated">
      <UnifiedCardContent>
        <UnifiedInput 
          placeholder="Buscar..." 
          icon={Search}
          fullWidth 
        />
        <UnifiedButton variant="primary">
          Acción
        </UnifiedButton>
      </UnifiedCardContent>
    </UnifiedCard>
  );
}
```

## 📱 Responsive Design

### Breakpoints Estándar

```css
/* Mobile First */
.base-style { /* < 640px */ }
.sm\:style { /* ≥ 640px */ }
.md\:style { /* ≥ 768px */ }
.lg\:style { /* ≥ 1024px */ }
.xl\:style { /* ≥ 1280px */ }
```

### Componentes Adaptativos

1. **GenericGridResponsive**: Tabla en desktop, cards en mobile
2. **UnifiedFieldGroup**: Columnas adaptativas
3. **UnifiedButton**: Tamaños responsivos
4. **UnifiedModal**: Tamaños adaptativos

## 🛠️ Herramientas de Desarrollo

### Helpers de Componentes

```typescript
import { componentHelpers } from '@/components/ui/unified';

// Combinar clases
const className = componentHelpers.combineWithUnified(
  unifiedStyles.primaryButton, 
  'custom-class'
);

// Props responsivos
const responsiveClass = componentHelpers.responsiveProps(
  'text-base',    // base
  'text-lg',      // sm
  'text-xl',      // md
  'text-2xl',     // lg
  'text-3xl'      // xl
);
```

### Patrones de Animación

```typescript
// Animaciones predefinidas
className={commonPatterns.animations.fadeIn}
className={commonPatterns.animations.slideIn}
className={commonPatterns.animations.hover}
```

## 🎯 Mejores Prácticas

### 1. Importaciones

```typescript
// ✅ Correcto - Importación unificada
import { 
  UnifiedButton, 
  UnifiedCard, 
  commonPatterns 
} from '@/components/ui/unified';

// ❌ Incorrecto - Importaciones individuales
import { UnifiedButton } from '@/components/ui/unified-button';
import { UnifiedCard } from '@/components/ui/unified-card';
```

### 2. Tipos y Modelos

```typescript
// ✅ Correcto - Tipos del modelo unificado
import type { PlayerWithStats, GameFormData } from '@/lib/model';

// ❌ Incorrecto - Interfaces duplicadas
interface Player {
  id: number;
  nickname: string;
  // ...
}
```

### 3. Componentes Responsivos

```typescript
// ✅ Correcto - Uso de patrones unificados
<UnifiedFieldGroup columns={3}>
  {/* Campos automáticamente responsivos */}
</UnifiedFieldGroup>

// ❌ Incorrecto - CSS manual
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mantenimiento manual */}
</div>
```

### 4. Estados y Variantes

```typescript
// ✅ Correcto - Variantes semánticas
<UnifiedBadge variant="success">Activo</UnifiedBadge>
<UnifiedButton variant="delete">Eliminar</UnifiedButton>

// ❌ Incorrecto - Estilos manuales
<Badge className="bg-green-100 text-green-800">Activo</Badge>
```

## 🔍 Debugging y Mantenimiento

### Identificar Componentes No Unificados

```bash
# Buscar importaciones del sistema anterior
grep -r "from '@/components/ui/button'" --include="*.tsx"
grep -r "from '@/components/ui/card'" --include="*.tsx"

# Buscar interfaces duplicadas
grep -r "interface.*Player" --include="*.ts" --include="*.tsx"
```

### Migración Gradual

1. **Fase 1**: Crear componentes unificados ✅
2. **Fase 2**: Migrar ABM principales ✅
3. **Fase 3**: Migrar páginas públicas
4. **Fase 4**: Migrar componentes especializados
5. **Fase 5**: Cleanup de componentes antiguos

## 📊 Beneficios Implementados

### Desarrollo
- ✅ **Consistencia**: Diseño unificado en toda la app
- ✅ **Productividad**: Componentes reutilizables
- ✅ **Mantenibilidad**: Cambios centralizados
- ✅ **TypeScript**: Tipado fuerte y autocompletado

### UX/UI
- ✅ **Responsive**: Adaptativo a todos los dispositivos
- ✅ **Accesibilidad**: Estándares implementados
- ✅ **Performance**: Componentes optimizados
- ✅ **Coherencia**: Experiencia uniforme

### Arquitectura
- ✅ **Modularidad**: Componentes independientes
- ✅ **Escalabilidad**: Fácil extensión
- ✅ **Testabilidad**: Componentes aislados
- ✅ **Documentación**: Patrones claros

## 🚀 Próximos Pasos

1. **Migrar páginas restantes** al sistema unificado
2. **Crear más componentes especializados** (charts, tables)
3. **Implementar tema dark/light** unificado
4. **Optimizar bundle size** con tree-shaking
5. **Crear Storybook** para documentación visual

---

*Este documento se actualiza continuamente conforme evoluciona la arquitectura del sistema.*
