# Sistema de Colores

## 🎯 **Descripción**

Sistema de colores unificado para la aplicación CAMR Rank.

## 🌈 **Paleta Principal**

### **Colores de Marca**
- **Brand Primary**: Azul violáceo (#3f7dff) - Color principal de marca
- **Brand Secondary**: Azul (#2c62db) - Botones activos, foco
- **Brand Accent**: Rojo (#ff5d6a) - Acento secundario del logo

### **Colores Semánticos**
- **Success**: Verde (#22c55e) - Éxitos, confirmaciones
- **Warning**: Amarillo (#f59e0b) - Advertencias
- **Danger**: Rojo (#ef4444) - Errores, eliminaciones

### **Colores por Sección**
- **Común**: Azul (#2563eb) - Para usuarios normales
- **Admin**: Rojo (#dc2626) - Para administradores

### **Neutros**
- **Background**: Fondo principal (blanco/negro automático)
- **Foreground**: Texto principal (negro/blanco automático)
- **Muted**: Texto secundario (gris automático)
- **Border**: Bordes (gris claro/oscuro automático)

## 🎨 **Uso en Componentes**

### **Botones por Sección**
```tsx
// Botón para sección común (usuarios normales)
<Button className="common-primary">
  Guardar
</Button>

// Botón para sección admin
<Button className="admin-primary">
  Eliminar
</Button>

// Botón con variantes de Shadcn
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
```

### **Colores de Texto**
```tsx
// Texto con colores de marca
<h1 className="common-primary-text">Título Principal</h1>
<p className="admin-primary-text">Texto de Admin</p>

// Texto con colores semánticos
<span className="text-green-600">Éxito</span>
<span className="text-red-600">Error</span>
```

### **Cards y Contenedores**
```tsx
<Card className="bg-card text-card-foreground border-border">
  Contenido
</Card>
```

## 🌙 **Modo Oscuro**

Los colores se adaptan automáticamente usando variables CSS:

```css
:root {
  --background: 0 0% 100%;        /* Blanco */
  --foreground: 222.2 84% 4.9%;  /* Negro */
}

.dark {
  --background: 222.2 84% 4.9%;  /* Negro */
  --foreground: 210 40% 98%;      /* Blanco */
}
```

## 🔧 **Variables CSS**

Todas las variables están definidas en `app/globals.css`:

### **Variables Base (Shadcn)**
- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--border` / `--input` / `--ring`

### **Variables de Marca**
- `--brand-400` / `--brand-500` / `--brand-600`
- `--accent-500` (rojo del logo)

### **Variables por Sección**
- `--common-primary` / `--common-primary-hover` / `--common-primary-light`
- `--admin-primary` / `--admin-primary-hover` / `--admin-primary-light`

### **Clases de Utilidad**
- `.common-primary` / `.common-primary-text` / `.common-primary-border`
- `.admin-primary` / `.admin-primary-text` / `.admin-primary-border`

## 📱 **Responsive**

Los colores mantienen el mismo contraste en todos los tamaños de pantalla.
