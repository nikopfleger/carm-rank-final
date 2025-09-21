# Vercel Blob Storage Setup

## 📝 Configuración para Imágenes de Pending Games

Este proyecto ahora usa **Vercel Blob** como storage principal para imágenes, con fallback graceful al sistema local.

## 🚀 Configuración en Vercel

### 1. Crear Blob Store

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a la tab **Storage**
3. Haz clic en **Create Database**
4. Selecciona **Blob**
5. Asigna un nombre (ej: `camr-images`)
6. Haz clic en **Create**

### 2. Obtener Token

1. Una vez creado el Blob store, ve a la tab **Settings**
2. Copia el **Read Write Token**
3. Agrega la variable de entorno en Vercel:

```
CARM_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xDW0UcmfAvqYQPEh_ndz3gFikPFmqnZmRnsBsAW69ocRNGS
```

### 3. Configurar Next.js para Blob Storage

En `next.config.mjs`, agregar patrón para imágenes remotas:

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // ... otros patrones existentes
    ],
  },
};
```

### 4. Variables de Entorno Requeridas

En el dashboard de Vercel, asegúrate de tener:

```bash
# Required para Blob Storage
CARM_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xDW0UcmfAvqYQPEh_ndz3gFikPFmqnZmRnsBsAW69ocRNGS

# Database URLs (formato estándar Vercel/Prisma)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=carm
DIRECT_URL=postgresql://user:password@host:5432/database?schema=carm

# OAuth con Google
GOOGLE_CLIENT_ID=tu_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion

# NextAuth
NEXTAUTH_SECRET=tu_super_secret_muy_largo_para_produccion
NEXTAUTH_URL=https://tu-app.vercel.app

# Owner
OWNER_EMAIL=tu_email@ejemplo.com
```

## 🔄 Comportamiento del Sistema

### ✅ Con Blob Configurado:
- **Subida**: Imágenes van a Vercel Blob
- **URL**: URLs de blob.vercel-storage.com
- **CDN**: Global automático
- **Performance**: Óptimo

### ⚠️ Sin Blob Configurado (Fallback Simplificado):
- **Subida**: Se usa imagen default "Image Not Available"
- **URL**: `/images/image-not-available.svg`
- **Logs**: Warnings en consola (no errores)
- **Comportamiento**: Funcional, siempre muestra algo
- **Validación**: Si imagen default no existe → ERROR (crítico)

## 🐛 Troubleshooting

### Error: "CARM_BLOB_READ_WRITE_TOKEN faltante"
```bash
# Verificar en Vercel Dashboard > Settings > Environment Variables
CARM_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### Error: "Access denied to blob"
- Verificar que el token tenga permisos de Read/Write
- Recrear el token si es necesario

### Imágenes no se cargan
1. Verificar logs en Vercel Functions
2. Comprobar que el Blob store esté activo
3. Verificar que las URLs sean accesibles públicamente

### Error: "Imagen default no disponible"
```bash
❌ Imagen default no encontrada: /path/to/public/images/image-not-available.svg
```
- Verificar que existe `public/images/image-not-available.svg`
- Re-crear el archivo si fue eliminado accidentalmente

## 📊 Migración

### Estado Actual
- ✅ **Nuevas imágenes**: Usan Blob automáticamente
- ✅ **Cleanup**: Funciona solo con Blob (simplificado)
- ✅ **Fallback**: Imagen default si Blob falla
- ✅ **Siempre funcional**: Nunca falla por problemas de imágenes

### Costo Estimado
```
Vercel Blob Pricing:
- Storage: $0.15/GB/mes
- Bandwidth: $0.005/GB
- 20 imágenes (~50MB): ~$0.01/mes
```

## 🔧 Desarrollo Local

Para desarrollo local, el sistema funciona sin Blob:

```bash
# .env (local)
# No es necesario CARM_BLOB_READ_WRITE_TOKEN
# El sistema usa storage local automáticamente
```

Los warnings en consola son normales y esperados durante desarrollo.
