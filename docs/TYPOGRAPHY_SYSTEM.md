# Sistema de Tipografía Global

## 🎯 **Objetivo**

Unificar todos los estilos de texto en la aplicación para mantener consistencia visual.

## 📚 **Clases Disponibles**

### **Headings (Títulos)**
- `.text-heading-1` - Título principal (36px, bold)
- `.text-heading-2` - Título secundario (30px, semibold) 
- `.text-heading-3` - Título terciario (24px, semibold)
- `.text-heading-4` - Título cuaternario (20px, semibold)

### **Body (Cuerpo de texto)**
- `.text-body-large` - Texto grande (18px, normal)
- `.text-body` - Texto estándar (16px, normal)
- `.text-body-small` - Texto pequeño (14px, normal)
- `.text-caption` - Texto muy pequeño (12px, normal)

### **Variantes de Peso**
- `.text-bold` - Peso bold (700)
- `.text-semibold` - Peso semibold (600)
- `.text-medium` - Peso medium (500)

### **Variantes de Color**
- `.text-primary` - Color principal (automático dark/light)
- `.text-secondary` - Color secundario (automático dark/light)
- `.text-muted` - Color atenuado (automático dark/light)
- `.text-inverse` - Color inverso (automático dark/light)

## 🚀 **Cómo Usar**

### **En CSS Modules**
```css
.miTitulo {
  composes: text-heading-2;
}

.miTexto {
  composes: text-body-small;
}
```

### **En Tailwind**
```tsx
<h1 className="text-heading-1">Título Principal</h1>
<p className="text-body text-secondary">Texto secundario</p>
```

## 🎨 **Características**

- **Dark Mode**: Automático y consistente
- **Responsive**: Se adaptan a diferentes tamaños de pantalla
- **Performance**: CSS optimizado y reutilizable
- **Mantenimiento**: Cambios centralizados en `app/globals.css`

## 🚫 **Qué NO Hacer**

- ❌ Definir `font-size`, `font-weight`, `color` en CSS modules
- ❌ Usar clases Tailwind de texto cuando existan clases globales
- ❌ Crear variantes duplicadas de tipografía
