# 🔐 Configuración OAuth para UAT (User Acceptance Testing) (referencia)

> Guía específica para pruebas en red local/IP. Para serverless/producción ver `docs/SERVERLESS_OAUTH.md`.

## 🎯 Problema

Cuando accedes a la aplicación desde otra PC en la red local (ej: `http://192.168.1.100:3000`), Google OAuth falla porque está configurado para hacer callback solo a `localhost:3000`.

## ✅ Solución Implementada

### **1. Configuración Automática**

```bash
# Detectar IP local y configurar .env automáticamente
npm run setup:uat

# Iniciar servidor en modo UAT
npm run dev:uat
```

### **2. Configuración Manual en Google Cloud Console**

1. **Ir a Google Cloud Console:**
   - https://console.cloud.google.com
   - Seleccionar tu proyecto

2. **Configurar OAuth:**
   - APIs y servicios → Credenciales
   - Editar tu OAuth 2.0 Client ID
   - En "URIs de redirección autorizados" agregar:

```
http://localhost:3000/api/auth/callback/google
http://TU-IP-LOCAL:3000/api/auth/callback/google
```

**Ejemplo con IP real:**
```
http://localhost:3000/api/auth/callback/google
http://192.168.1.100:3000/api/auth/callback/google
```

### **3. Variables de Entorno**

Tu `.env` debe tener:

```bash
# Para desarrollo local
NEXTAUTH_URL=http://localhost:3000

# Para UAT (se actualiza automáticamente con npm run setup:uat)
NEXTAUTH_URL=http://192.168.1.100:3000

# OAuth Google (mismo para ambos)
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

## 🚀 Flujo de Trabajo UAT

### **Paso 1: Configurar OAuth**
```bash
npm run setup:uat
```

### **Paso 2: Iniciar servidor UAT**
```bash
npm run dev:uat
```

### **Paso 3: Acceder desde otras PCs**
- Desde tu PC: `http://localhost:3000`
- Desde otras PCs: `http://TU-IP:3000`

## 🔧 Funcionalidades Implementadas

### **1. Detección Automática de URL Base**
- `lib/get-base-url.ts`: Helper para obtener URL base dinámicamente
- Funciona en cliente y servidor
- Detecta automáticamente modo UAT

### **2. Middleware Inteligente**
- `middleware.ts`: Configura headers para OAuth dinámico
- Detecta IPs locales automáticamente
- Configura `x-forwarded-host` y `x-forwarded-proto`

### **3. Script de Configuración**
- `scripts/setup-oauth-uat.js`: Detecta IP local y actualiza `.env`
- Muestra las URLs que necesitas configurar en Google

### **4. Auth Dinámico**
- `lib/auth-vercel.ts`: Usa URL base dinámica para callbacks
- Compatible con localhost y IPs locales

## 🛠️ Troubleshooting

### **Error: "OAuth callback mismatch"**
```bash
# 1. Ejecutar setup automático
npm run setup:uat

# 2. Verificar que las URLs estén en Google Console
# 3. Reiniciar el servidor
npm run dev:uat
```

### **Error: "NEXTAUTH_URL not found"**
```bash
# Verificar que .env existe y tiene NEXTAUTH_URL
cat .env | grep NEXTAUTH_URL

# Si no existe, ejecutar:
npm run setup:uat
```

### **No puedo acceder desde otra PC**
```bash
# 1. Verificar que el servidor está en modo UAT
npm run dev:uat

# 2. Verificar firewall (Windows)
# Permitir puerto 3000 en Windows Firewall

# 3. Verificar IP
ipconfig  # Windows
ifconfig  # Linux/Mac
```

## 📋 URLs de Callback Comunes

Para desarrollo típico, agregar estas URLs en Google OAuth:

```
http://localhost:3000/api/auth/callback/google
http://127.0.0.1:3000/api/auth/callback/google
http://192.168.1.100:3000/api/auth/callback/google
http://192.168.1.101:3000/api/auth/callback/google
http://10.0.0.100:3000/api/auth/callback/google
```

## 🔒 Seguridad

- ✅ Solo funciona en redes locales (192.168.x.x, 10.0.x.x, 172.x.x.x)
- ✅ No afecta configuración de producción
- ✅ Headers de seguridad configurados automáticamente
- ✅ Detección automática de modo UAT

## 🎯 Resultado

- ✅ OAuth funciona desde `localhost:3000`
- ✅ OAuth funciona desde `192.168.1.100:3000`
- ✅ Configuración automática de URLs
- ✅ Sin cambios manuales en código
- ✅ Compatible con producción
