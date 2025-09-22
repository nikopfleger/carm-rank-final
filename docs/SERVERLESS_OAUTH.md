# 🚀 OAuth en Serverless - Guía Completa (canónico)

## 🔍 **¿Funciona `process.env.NEXTAUTH_URL` en Serverless?**

### **✅ Respuesta Corta: SÍ, pero...**

`process.env.NEXTAUTH_URL` **SÍ funciona** en serverless, pero hay consideraciones importantes:

## 🏗️ **Proveedor Serverless**

### **🔷 Vercel**
```bash
# Variables disponibles automáticamente:
VERCEL_URL=tu-app.vercel.app          # Auto-detectada
NEXTAUTH_URL=https://tu-app.vercel.app # Manual (recomendado)

# NextAuth detecta automáticamente:
# - VERCEL_URL para construir callbacks
# - Headers x-forwarded-* para protocolo/host
```

> Otros proveedores (Netlify/Railway) no son usados en este proyecto y se omiten para simplicidad.

## ⚡ **Optimizaciones Implementadas**

### **1. 🧠 Detección Inteligente de URL Base**

```typescript
// lib/get-base-url.ts
export function getBaseUrl(): string {
  // Cliente: window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Serverless: Múltiples fuentes
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Otros proveedores omitidos
  
  return 'http://localhost:3000'; // Desarrollo
}
```

### **2. 🔄 Headers Dinámicos**

```typescript
// Obtener URL desde request headers (API routes)
export function getBaseUrlFromHeaders(headers: Headers): string {
  const forwardedHost = headers.get('x-forwarded-host');
  const forwardedProto = headers.get('x-forwarded-proto');
  
  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Fallback a detección automática
  return getBaseUrl();
}
```

### **3. 🛡️ Auth Callback Robusto**

```typescript
// lib/auth-vercel.ts - signIn callback
async signIn({ user, account, profile, request }) {
  // 1. Detectar URL base
  let baseUrl = getBaseUrl();
  
  // 2. En serverless, usar URL del request si está disponible
  if (request?.url) {
    const requestUrl = new URL(request.url);
    baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  }
  
  // 3. Llamar API con URL correcta
  const response = await fetch(`${baseUrl}/api/auth/check-user`, {
    // ...
  });
}
```

## 🔧 **Configuración por Proveedor**

### **🔷 Vercel**

#### **Variables de Entorno:**
```bash
# Opción 1: Auto-detección (recomendado para producción)
# Vercel configura automáticamente VERCEL_URL

# Opción 2: Manual (recomendado para control total)
NEXTAUTH_URL=https://tu-app.vercel.app

# OAuth Google
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

#### **Google OAuth URLs:**
```
https://tu-app.vercel.app/api/auth/callback/google
```

### **🟦 Netlify**

#### **Variables de Entorno:**
```bash
NEXTAUTH_URL=https://tu-app.netlify.app
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

### **🟪 Railway**

#### **Variables de Entorno:**
```bash
NEXTAUTH_URL=https://tu-app.railway.app
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

## 🚨 **Problemas Comunes y Soluciones**

### **1. ❌ "OAuth callback mismatch"**

**Problema:** URL de callback no coincide

**Solución:**
```bash
# 1. Verificar variable de entorno
echo $NEXTAUTH_URL

# 2. Verificar Google Console
# Debe coincidir exactamente con NEXTAUTH_URL + /api/auth/callback/google

# 3. Para múltiples entornos, agregar todas las URLs:
https://tu-app.vercel.app/api/auth/callback/google
https://tu-app-preview.vercel.app/api/auth/callback/google
```

### **2. ❌ "process.env.NEXTAUTH_URL is undefined"**

**Problema:** Variable no disponible en runtime

**Solución:**
```typescript
// ❌ Problemático
const url = process.env.NEXTAUTH_URL;

// ✅ Robusto
const url = getBaseUrl(); // Usa múltiples fuentes
```

### **3. ❌ "Cold start timeout"**

**Problema:** Variables no disponibles en cold start

**Solución:**
```typescript
// ✅ Implementado: Fallbacks múltiples
function getBaseUrl() {
  // Intenta múltiples fuentes
  // Si falla una, usa la siguiente
}
```

## 🎯 **Mejores Prácticas**

### **1. ✅ Variables de Entorno**
```bash
# Desarrollo
NEXTAUTH_URL=http://localhost:3000

# UAT
NEXTAUTH_URL=http://192.168.1.100:3000

# Producción
NEXTAUTH_URL=https://tu-app.vercel.app
```

### **2. ✅ Google OAuth URLs**
```
# Desarrollo
http://localhost:3000/api/auth/callback/google

# UAT
http://192.168.1.100:3000/api/auth/callback/google

# Producción
https://tu-app.vercel.app/api/auth/callback/google
```

### **3. ✅ Detección Automática**
```typescript
// Usar helpers en lugar de process.env directo
import { getBaseUrl, getBaseUrlFromHeaders } from '@/lib/get-base-url';

// En componentes
const baseUrl = getBaseUrl();

// En API routes
const baseUrl = getBaseUrlFromHeaders(request.headers);
```

## 🔍 **Debug en Serverless**

### **Verificar Variables:**
```typescript
// En API route o middleware
console.log('Environment variables:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  NODE_ENV: process.env.NODE_ENV
});
```

### **Verificar Headers:**
```typescript
// En middleware
console.log('Request headers:', {
  host: request.headers.get('host'),
  'x-forwarded-host': request.headers.get('x-forwarded-host'),
  'x-forwarded-proto': request.headers.get('x-forwarded-proto')
});
```

## 🎉 **Resultado**

Con estas optimizaciones:

- ✅ **Funciona en Vercel** (auto-detección + manual)
- ✅ **Funciona en Netlify** (auto-detección + manual)
- ✅ **Funciona en Railway** (auto-detección + manual)
- ✅ **Funciona en desarrollo** (localhost)
- ✅ **Funciona en UAT** (IP local)
- ✅ **Fallbacks robustos** (múltiples fuentes)
- ✅ **Cold start safe** (no depende de una sola variable)

## 🚀 **Deploy Checklist**

- [ ] Configurar `NEXTAUTH_URL` en variables de entorno
- [ ] Agregar URL de callback en Google OAuth
- [ ] Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` están configurados
- [ ] Probar login en preview/staging
- [ ] Probar login en producción
