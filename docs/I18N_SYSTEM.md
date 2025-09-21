# Sistema de Internacionalización (i18n)

## 🎯 **Descripción**

Sistema de soporte multiidioma para Español, Inglés y Japonés.

## 🌐 **Idiomas Soportados**

- **Español (es)** - Idioma principal
- **Inglés (en)** - Idioma secundario
- **Japonés (ja)** - Para términos técnicos

## 🚀 **Uso Básico**

### **Hook useI18nContext**
```tsx
import { useI18nContext } from '@/components/providers/i18n-provider';

function MiComponente() {
  const { language, t, setLanguage, isLoading, isReady } = useI18nContext();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button onClick={() => setLanguage('en')}>
        {t('common.switchToEnglish')}
      </button>
    </div>
  );
}
```

### **Función de Traducción**
```tsx
// Traducción simple
t('common.title') // "Título"

// Traducción con parámetros
t('player.rank', { rank: '初段' }) // "Rango: 初段"

// Traducción con fallback
t('player.unknown', 'Jugador Desconocido')
```

## 📁 **Estructura de Archivos**

```
lib/i18n/translations/
├── es.json          # Español (principal)
├── en.json          # Inglés
└── ja.json          # Japonés
```

## 🔧 **Configuración**

### **Provider en Layout**
```tsx
// app/layout.tsx
import { I18nProvider } from '@/components/providers/i18n-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

## 📚 **Claves de Traducción**

### **Comunes**
- `common.title` - Título de la aplicación
- `common.loading` - Estado de carga
- `common.error` - Mensaje de error

### **Jugadores**
- `player.rank` - Rango del jugador
- `player.games` - Número de juegos
- `player.points` - Puntos

### **Admin**
- `admin.dashboard` - Panel de administración
- `admin.games` - Gestión de juegos
- `admin.players` - Gestión de jugadores

## 🎨 **Características**

- ✅ **Cambio de idioma** en tiempo real
- ✅ **Persistencia** en localStorage
- ✅ **Fallbacks** automáticos
- ✅ **Soporte TypeScript** completo
- ✅ **Traducciones estáticas** (no lazy loading)
- ✅ **SSR compatible** con hidratación correcta
- ✅ **Estados de carga** (isLoading, isReady, hasError)
- ✅ **Detección de cliente** para evitar hydration mismatch
