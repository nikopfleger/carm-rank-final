# Sistema de Badges de Rango (referencia UI)

> Especificación de badges Dan. Para consumo de componentes ver `components/ui/rank-badge.tsx`.

## 🎯 **Descripción**

Sistema unificado para mostrar badges de rangos Dan en toda la aplicación.

## 🎨 **Componente RankBadge**

```tsx
import { RankBadge } from '@/components/ui/rank-badge';

// Uso básico
<RankBadge rank="初段" />

// Variantes disponibles
<RankBadge rank="初段" variant="default" />        // Tamaño mediano
<RankBadge rank="初段" variant="compact" />       // Tamaño pequeño
<RankBadge rank="初段" variant="detailed" />      // Tamaño grande
<RankBadge rank="初段" variant="with-progress" /> // Con barra de progreso
<RankBadge rank="初段" variant="modern" />        // Estilo moderno

// Con progreso hacia siguiente rango
<RankBadge 
  rank="初段" 
  variant="with-progress"
  progress={{
    current: 150,
    max: 200,
    percentage: 75,
    nextRank: "二段",
    pointsToNext: 50
  }}
/>

// Con color personalizado desde base de datos
<RankBadge rank="初段" color="#f59e0b" />
```

## 🎨 **Sistema de Colores**

| Rango | Color | Clase CSS |
|-------|-------|-----------|
| **Principiante** | Gris | `.rank-beginner` |
| **Kyu (9級 - 1級)** | Azul | `.rank-kyu` |
| **Dan Bajo (初段 - 三段)** | Verde | `.rank-dan-low` |
| **Dan Medio (四段 - 六段)** | Amarillo | `.rank-dan-mid` |
| **Dan Alto (七段 - 八段)** | Naranja | `.rank-dan-high` |
| **Dan Maestro (九段 - 十段)** | Rojo | `.rank-dan-master` |
| **Dios (神室王)** | Púrpura | `.rank-god` |

## 📱 **Responsive**

- **Mobile**: Tamaños reducidos automáticamente
- **Dark Mode**: Soporte automático
- **Hover**: Efectos de escala y sombra

## 🔧 **Características**

- ✅ **Solo kanji** (sin traducciones)
- ✅ **Múltiples variantes** (default, compact, detailed, with-progress, modern)
- ✅ **Tooltip condicional** según idioma
- ✅ **Colores automáticos** basados en rango
- ✅ **Colores personalizados** desde base de datos
- ✅ **Barra de progreso** hacia siguiente rango
- ✅ **Soporte completo** para modo oscuro
- ✅ **Accesibilidad** con aria-labels
- ✅ **Responsive** con tamaños adaptativos
