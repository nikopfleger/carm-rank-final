# 🚀 Guía de Despliegue en Vercel Serverless

## ✅ Estado de Compatibilidad

**¡Tu aplicación está 100% lista para Vercel serverless!** Todos los cambios necesarios ya están implementados.

## 🔧 Variables de Entorno para Vercel

### **📋 Variables Obligatorias:**

```bash
# Opción 1: Formato JDBC con encriptación (RECOMENDADO - tu sistema actual)
JDBC_URL=jdbc:postgresql://host:5432/database?currentSchema=carm
JDBC_USER=tu_usuario
JDBC_PASS=tu_contraseña_encriptada_base64
PRIVATE_KEY=tu_clave_privada_rsa_completa

# Opción 2: DATABASE_URL simple (alternativo)
# DATABASE_URL=postgresql://user:password@host:5432/database?schema=carm

# OAuth Google (usar credenciales de producción)
GOOGLE_CLIENT_ID=tu_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion

# NextAuth (generar nuevo secret para producción)
NEXTAUTH_SECRET=tu_secret_muy_largo_y_seguro_para_produccion

# NextAuth URL - Vercel auto-detecta, pero manual es más confiable
NEXTAUTH_URL=https://tu-app.vercel.app

# Nota: Vercel también provee automáticamente:
# VERCEL_URL=tu-app.vercel.app (sin https://)
# Nuestro sistema usa ambas como fallback

# Owner (tu configuración actual)
OWNER_EMAIL=nikopfleger@gmail.com
OWNER_NAME=Nicolas Pfleger

# Puerto (opcional en Vercel, pero útil para desarrollo)
PORT=3000
```

### **🔧 Variables Opcionales (Recomendadas):**

```bash
# Pool de conexiones (tu configuración actual, ajustada para serverless)
DB_POOL_MAX=10
DB_POOL_MIN=1
DB_POOL_TIMEOUT=30000
DB_CONNECT_TIMEOUT=30000
DB_KEEP_ALIVE_INTERVAL=15000

# Nota: Tu configuración local usa valores más altos:
# DB_POOL_MAX=20, DB_POOL_TIMEOUT=60000, DB_KEEP_ALIVE_INTERVAL=30000
# Para Vercel serverless, se recomiendan valores más bajos

# Configuración de app
NODE_ENV=production
APP_NAME=CAMR Rank
APP_VERSION=1.0.0

# Imágenes (ajustado para Vercel)
MAX_IMAGE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
IMAGE_QUALITY=85
```

## 🔐 Sistema de Encriptación (Tu Configuración Actual)

### **✅ Ventajas de tu Sistema JDBC + Encriptación:**

1. **Seguridad Máxima**: Contraseñas nunca en texto plano
2. **Compatible Vercel**: Funciona perfectamente en serverless
3. **Fallback Inteligente**: Si falla la encriptación, usa texto plano
4. **Flexible**: Soporta clave desde variable de entorno o archivo

### **🔧 Cómo Funciona en Vercel:**

```bash
# Tu configuración actual (MANTENER):
JDBC_URL=jdbc:postgresql://host:5432/db?currentSchema=carm
JDBC_USER=tu_usuario
JDBC_PASS=contraseña_encriptada_base64
PRIVATE_KEY=nMIIEvgIBADANBgkqhkiG...

# El sistema automáticamente:
# 1. Lee JDBC_URL, JDBC_USER, JDBC_PASS
# 2. Desencripta JDBC_PASS usando PRIVATE_KEY
# 3. Convierte a DATABASE_URL para Prisma
# 4. Si falla, usa contraseña sin encriptar (fallback)
```

### **🚀 Para Vercel (Usar tu Sistema):**

1. **Crear DB en Neon/Supabase** con contraseña fuerte
2. **Encriptar contraseña** con tu herramienta crypto
3. **Configurar variables en Vercel:**

```bash
# Ejemplo basado en tu configuración actual:
JDBC_URL=jdbc:postgresql://ep-cool-cloud-123456.us-east-1.aws.neon.tech:5432/carm_ranking?currentSchema=carm
JDBC_USER=carm_admin
JDBC_PASS=nueva_contraseña_encriptada_base64_aqui
PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCuVusMizC/U8f7bTS2ji81Ii52khPOVD/ww9ELoF+b8/cxKFmLW9XKrTsYTmCfh3DVWQMN/d1hIPLUfamTk8PqEbOauongfiE0ACaqt4i2Op3fChAa9/PrbtQ8Kd0Mda6TH17OyW5/eoJ0sIXtH+WIzsHrGtgiU4B2taSpjgj4rJQBqUZt6Dz5PPL0hDWDP7am2wTD+kyJThO/GO5Ew6xxzhk+amA/dVKJMWD3mkjIJQe729bW55G3Q5j7Zp/exPsmagJvMoWJd/mPM5o+qM3P87OhNR+xuIvLgyuJ2JJrZW/EyuE+fH3fJkNHZdDyrBR7BtZvBovrPT1cc+2zX/tDAgMBAAECggEACDtdbOGzow0bL8GH0CjljL448GtUWRU8UauFVuWzLgN2hBEyLTTgYuoMFMk6ob288634yXPXvKrYHHV0iN3czdQZJXCyavG5sqFhMgVphKU+6BWrDgLwNwksJ00YvWpfHF5KVTxIpedMeqMNJ9WuOmf82xOQ6goEUlagWEs3HDrBuEWpcHub323t+Kid+QnrvNWkYaWM9dGYKDuR92EF/Ys9YYcTaIwoQLmKpk1Dfowb7gIV8y/ej0ulqqvNwPVQDZzlbqca3asgoIuyVk/Ml4ZyUZlWw79fA2tDuTe/SxA1ZVznKuzR3R+9Mg3sMPuRjrbiSIJcQ1KjXsLXQSl3XQKBgQC3BQ1q/zmkJfpJYkp94KbMKJeJpXVGN4BLtqUrka25OtNlRnh0iF4snaWfWKdryTWRPtJpJhy5qKMrEdCNddMGto+g6KX30Pf0r8GAvAGx0DyZaGgNjegcam5iairZHS+Q/91av2+XYY/Ps4OV6NEMKJCSgpIQTdWElJKZS4R1BQKBgQDz28acF7CtVqXcW8iTosWGSgf7Z9JdsMU4mRUQAzVF78X4cdjxP2t2wSpFv+Ghp5ESoHFhAr+yXHTAnRDYeqSvvOr2zZvbS+EobmnLlJflP3QbK2LcMcitsLmGh5Yv3pxqCPJHmKfTLaodOjKJ4rQ64vNEQ25WqXM/DkOGnvohpwKBgGNRDpL9pV36bfPcrufYPSuU64b6jsVn4Os1VjRqfYeC8KyIrV0vk0tK0VHDXjcTnUoQeUYuNHBbnxAEPtRFGBsQfqinF0l/0M6rgapGW/UON5RYH/8a/tZMu1IUouPm/qUE9C4GrJvNiakAlWuIR8j9Slb3HCRU2IV1yof9fwexAoGBALyi3dgRW1I7HMKBHX9XAoUG73XCsjBXdbh6cpiYYrVe7T1qk+7KqE6Mzi52aAusm8RU6F+qyK8oZgg5d7Z96Lco5HlWQ6I36ExmXOBmabmkhCQgQ7EhsaLqehle+Qa+pTBBC2nm5KuvP1CsnDudat3CgXvkzY2sNsIoPoP8pnExAoGBALXaVwFtmb+ukozqu8Si5II/Ftc4PtMrmCipwSZsbmNri3JZWnfiZCeByGPVFHoddR2SN0ElSBrxujlTmXOxKjGbrMC1M/ApwUwvbGmZxXKJCbUdvIoSOQm3wse5jlU+mRrj55iXpd6jSZdrlNDtia5ZpxLwEKzX4sLu4w0PnNYj

GOOGLE_CLIENT_ID=919638977696-NUEVA-PRODUCCION.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-NUEVA-PRODUCCION
NEXTAUTH_SECRET=nuevo_secret_muy_largo_y_seguro_para_produccion
NEXTAUTH_URL=https://tu-app.vercel.app
OWNER_EMAIL=nikopfleger@gmail.com
OWNER_NAME=Nicolas Pfleger
```

### **🔑 Formato de PRIVATE_KEY para Vercel:**

```bash
# Opción 1: Con saltos de línea literales
PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----

# Opción 2: Con \n (más común en Vercel)
PRIVATE_KEY=nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...

# Opción 3: Solo el contenido (tu crypto-helper lo formatea)
PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
```

## 🗄️ Base de Datos Cloud

### **Opciones Recomendadas:**

1. **Neon (Recomendado)** - PostgreSQL serverless
   - ✅ Gratis hasta 10GB
   - ✅ Escalado automático
   - ✅ Compatible con Prisma
   - 🔗 [neon.tech](https://neon.tech)

2. **Supabase** - PostgreSQL con extras
   - ✅ Gratis hasta 500MB
   - ✅ Dashboard incluido
   - ✅ Compatible con Prisma
   - 🔗 [supabase.com](https://supabase.com)

3. **Railway** - PostgreSQL simple
   - ✅ Fácil configuración
   - ✅ Compatible con Prisma
   - 🔗 [railway.app](https://railway.app)

### **Configuración de Base de Datos:**

```sql
-- Crear schema (ejecutar después de crear la DB)
CREATE SCHEMA IF NOT EXISTS carm;

-- Configurar usuario (si es necesario)
GRANT ALL PRIVILEGES ON SCHEMA carm TO tu_usuario;
```

## 🚀 Proceso de Deploy

### **1. Preparar Repositorio:**
```bash
# Asegurar que todo esté commiteado
git add .
git commit -m "Preparar para deploy en Vercel"
git push origin main
```

### **2. Configurar Vercel:**
1. Ir a [vercel.com](https://vercel.com)
2. Conectar con GitHub
3. Importar tu repositorio `camr-rank`
4. Configurar variables de entorno (ver arriba)

### **3. Primer Deploy:**
El deploy se hará automáticamente. Después:

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Ejecutar contingencia (cargar datos básicos)
vercel --prod
# Luego ejecutar: npm run contingency
```

### **4. Verificar Funcionamiento:**
- ✅ Login con Google OAuth
- ✅ Crear/editar jugadores
- ✅ Cargar juegos
- ✅ Ver rankings
- ✅ Panel de administración

## 🔐 OAuth Google para Producción

### **Configurar Credenciales de Producción:**

1. **Google Cloud Console:**
   - Ir a [console.cloud.google.com](https://console.cloud.google.com)
   - Seleccionar tu proyecto (o crear uno nuevo)

2. **Configurar OAuth:**
   - APIs y servicios → Credenciales
   - Crear credenciales → ID de cliente OAuth 2.0
   - Tipo: Aplicación web
   - **URI de redirección:** `https://tu-app.vercel.app/api/auth/callback/google`

3. **Copiar credenciales a Vercel:**
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

## 🛠️ Comandos Post-Deploy

### **Carga Inicial de Datos:**
```bash
# Opción 1: Contingencia rápida (50 juegos)
npm run contingency

# Opción 2: Carga completa (todos los juegos)
npm run reset-and-load

# Opción 3: Solo configuraciones básicas
npm run reset
```

### **Mantenimiento:**
```bash
# Recalcular puntos existentes
npm run recalculate

# Ver logs
vercel logs tu-app.vercel.app

# Redeploy
vercel --prod
```

## 🔍 Troubleshooting

### **Error: "Database connection failed"**
- ✅ Verificar `DATABASE_URL` en Vercel
- ✅ Verificar que la DB cloud esté activa
- ✅ Verificar schema `carm` existe

### **Error: "OAuth callback mismatch"**
- ✅ Verificar URI de redirección en Google Console
- ✅ Debe ser exactamente: `https://tu-app.vercel.app/api/auth/callback/google`

### **Error: "NextAuth secret missing"**
- ✅ Generar nuevo secret: `openssl rand -base64 32`
- ✅ Configurar `NEXTAUTH_SECRET` en Vercel

### **Error: "Build failed"**
- ✅ Verificar que no hay errores de TypeScript
- ✅ Ejecutar `npm run build` localmente primero

## 📊 Monitoreo

### **Métricas Importantes:**
- 🔍 **Logs:** Vercel Dashboard → Functions
- 📈 **Performance:** Vercel Analytics
- 🗄️ **Database:** Panel de tu proveedor de DB
- 🔐 **Auth:** NextAuth debug logs

### **Límites de Vercel (Plan Hobby):**
- ✅ 100GB bandwidth/mes
- ✅ 100 deployments/día
- ✅ 10s timeout por función
- ✅ 50MB tamaño por función

## 🎯 Optimizaciones

### **Para Mejor Performance:**
1. **Pool de conexiones reducido** (ya configurado)
2. **Imágenes optimizadas** (ya implementado)
3. **Cache de configuraciones** (ya implementado)
4. **API routes eficientes** (ya implementado)

### **Monitoreo Continuo:**
- Revisar logs de Vercel regularmente
- Monitorear uso de base de datos
- Verificar performance de funciones

---

## ✅ Checklist Final (Basado en tu Configuración)

### **🔧 Preparación:**
- [ ] **Base de datos cloud** creada (Neon/Supabase)
- [ ] **Contraseña encriptada** con tu herramienta crypto
- [ ] **OAuth Google** configurado para producción (nueva URI de callback)
- [ ] **NEXTAUTH_SECRET** generado para producción

### **📋 Variables en Vercel:**
- [ ] `JDBC_URL` (con host cloud)
- [ ] `JDBC_USER` (carm_admin)  
- [ ] `JDBC_PASS` (nueva contraseña encriptada)
- [ ] `PRIVATE_KEY` (tu clave RSA completa)
- [ ] `GOOGLE_CLIENT_ID` (producción)
- [ ] `GOOGLE_CLIENT_SECRET` (producción)
- [ ] `NEXTAUTH_SECRET` (nuevo para producción)
- [ ] `NEXTAUTH_URL` (https://tu-app.vercel.app)
- [ ] `OWNER_EMAIL` (nikopfleger@gmail.com)
- [ ] `OWNER_NAME` (Nicolas Pfleger)

### **🚀 Deploy y Verificación:**
- [ ] Deploy automático exitoso
- [ ] `npm run contingency` ejecutado
- [ ] Login con Google funcionando
- [ ] Panel de administración accesible
- [ ] Carga/edición de juegos funcionando
- [ ] Rankings mostrándose correctamente

### **🔍 Configuración Específica Verificada:**
- [ ] Sistema JDBC + encriptación funcionando
- [ ] Pool de conexiones ajustado para serverless
- [ ] Tu email como OWNER configurado
- [ ] Cálculos de puntos funcionando correctamente

**¡Tu sistema de encriptación + JDBC está listo para Vercel! 🎉**
