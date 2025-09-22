# 🔄 Guía de Unificación de ABM (canónico)

> Este documento es la referencia canónica para migrar ABM al patrón unificado. Para el estado y prioridades ver `docs/ABM_UNIFICATION_PROGRESS.md`.

## 🎯 **Objetivo Completado**

Hemos unificado todos los ABM para usar el **patrón de Countries**: el formulario se muestra encima y oculta completamente el grid, proporcionando una experiencia de usuario consistente.

## ✅ **ABM Ya Migrados**

1. **✅ Countries** - Patrón de referencia (overlay que oculta grid)
2. **✅ UMA** - Migrado desde patrón "form debajo del grid"

## 🔧 **Componentes Creados**

### 1. `UnifiedABMLayout` 
- **Ubicación**: `components/admin/abm/unified-abm-layout.tsx`
- **Función**: Componente que implementa el patrón unificado
- **Características**:
  - Muestra SOLO el formulario O SOLO el grid (nunca ambos)
  - Header consistente con título y descripción
  - Configuración flexible para diferentes tipos de ABM

### 2. `useUnifiedABM` Hook
- **Ubicación**: `hooks/use-unified-abm.ts`
- **Función**: Hook que maneja toda la lógica de estado del ABM
- **Características**:
  - Estado unificado (showForm, editingItem, loading, etc.)
  - Handlers estándar (handleAdd, handleEdit, handleDelete, etc.)
  - Manejo de errores y éxito automático

## 📋 **ABM Pendientes de Migración**

Los siguientes ABM aún usan patrones diferentes y deben migrarse:

### 🔄 **Patrón Modal** (requiere migración)
- `players` - Usa PlayerFormModal
- `tournaments` - Usa modal con backdrop

### 📝 **Patrón Form Debajo** (requiere migración)  
- `seasons` - Form aparece debajo del grid
- `rulesets` - Form aparece debajo del grid
- `online-users` - Form aparece debajo del grid
- `dan-configs` - Form aparece debajo del grid
- `email-accounts` - Form aparece debajo del grid
- `link-requests` - Form aparece debajo del grid
- `rate-configs` - Form aparece debajo del grid
- `season-configs` - Form aparece debajo del grid
- `season-results` - Form aparece debajo del grid
- `tournament-results` - Form aparece debajo del grid
- `users` - Form aparece debajo del grid

## 🚀 **Pasos para Migrar un ABM**

### 1. **Actualizar Imports**
```typescript
// ANTES
import { GenericForm } from "@/components/admin/abm/generic-form";
import { GenericGrid } from "@/components/admin/abm/generic-grid";

// DESPUÉS  
import { FormField } from "@/components/admin/abm/generic-form";
import { GridColumn } from "@/components/admin/abm/generic-grid-responsive";
import { UnifiedABMLayout } from "@/components/admin/abm/unified-abm-layout";
import { useUnifiedABM } from "@/hooks/use-unified-abm";
```

### 2. **Configurar el Hook Unificado**
```typescript
// ANTES
const [items, setItems] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingItem, setEditingItem] = useState(null);
// ... más estado manual

// DESPUÉS
const abm = useUnifiedABM<ItemType>({
  loadFunction: async (showDeleted?: boolean) => {
    const result = await load(showDeleted); // o load() si no soporta deleted
    return { data: result as ItemType[] };
  },
  createFunction: create,
  updateFunction: (id, data) => update(Number(id), data),
  deleteFunction: (id) => remove(Number(id)),
  restoreFunction: (id) => restore(Number(id))
});
```

### 3. **Definir Configuración**
```typescript
// Campos del formulario
const formFields: FormField[] = [
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    required: true,
    placeholder: 'Ingrese el nombre'
  },
  // ... más campos
];

// Columnas del grid
const columns: GridColumn[] = [
  {
    key: 'name',
    label: 'Nombre',
    sortable: true
  },
  // ... más columnas
];
```

### 4. **Reemplazar el JSX**
```typescript
// ANTES
return (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-6">
      <h1>Título</h1>
      <p>Descripción</p>
    </div>
    
    <GenericGrid ... />
    
    {showForm && <GenericForm ... />}
  </div>
);

// DESPUÉS
return (
  <UnifiedABMLayout<ItemType>
    title="Administración de Items"
    description="Gestiona los items del sistema"
    
    showForm={abm.showForm}
    editingItem={abm.editingItem}
    
    data={abm.data}
    columns={columns}
    loading={abm.loading}
    
    formFields={formFields}
    formErrors={abm.formErrors}
    formSuccess={abm.formSuccess}
    successMessage="Item guardado correctamente"
    
    searchPlaceholder="Buscar items..."
    showDeleted={abm.showDeleted}
    onToggleShowDeleted={abm.handleToggleShowDeleted}
    
    onAdd={abm.handleAdd}
    onRefresh={abm.handleRefresh}
    onFormSubmit={abm.handleFormSubmit}
    onFormCancel={abm.handleFormCancel}
    
    emptyMessage="No hay items registrados"
  />
);
```

## 🎨 **Beneficios del Patrón Unificado**

### ✅ **Experiencia de Usuario Consistente**
- Todos los ABM se comportan igual
- Formulario siempre oculta el grid (sin confusión)
- Navegación intuitiva entre grid y formulario

### ✅ **Código Más Limpio**
- Menos código repetitivo
- Estado manejado automáticamente
- Handlers estándar reutilizables

### ✅ **Mantenimiento Simplificado**
- Un solo lugar para cambios de UI
- Lógica centralizada en el hook
- Fácil agregar nuevas funcionalidades

### ✅ **Mejor Performance**
- Menos re-renders innecesarios
- Estado optimizado
- Carga de datos eficiente

## 🔍 **Casos Especiales**

### ABM con Sub-grids (como Tournaments)
```typescript
<UnifiedABMLayout
  // ... props normales
  additionalFormContent={
    editingItem && (
      <div className="mt-6">
        {/* Sub-ABM o contenido adicional */}
      </div>
    )
  }
/>
```

### ABM sin funcionalidad de eliminados
```typescript
const abm = useUnifiedABM({
  loadFunction: async () => { // Sin parámetro showDeleted
    const result = await load();
    return { data: result };
  },
  // ... otras funciones
});

// En el JSX
<UnifiedABMLayout
  // ... otras props
  showDeleted={false}
  onToggleShowDeleted={undefined}
/>
```

## 🎯 **Próximos Pasos**

1. **Migrar ABM restantes** siguiendo esta guía
2. **Probar cada ABM** después de la migración
3. **Eliminar componentes obsoletos** una vez completada la migración
4. **Actualizar documentación** si es necesario

## 📞 **Soporte**

Si encuentras problemas durante la migración:
1. Revisa los ejemplos de Countries y UMA
2. Verifica que los tipos sean correctos
3. Asegúrate de que el hook de operaciones sea compatible
4. Consulta esta guía para casos especiales
