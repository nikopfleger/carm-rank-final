# 🚀 Guía de Despliegue en Vercel Serverless

## ✅ Estado de Compatibilidad

**¡Tu aplicación está 100% lista para Vercel serverless!** Ahora usa el sistema estándar de Vercel.

## 🔧 Variables de Entorno para Vercel

### **📋 Variables Obligatorias:**

```bash
# DATABASE_URL estándar (RECOMENDADO - formato Vercel)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=carm
DIRECT_URL=postgresql://user:password@host:5432/database?schema=carm

# Vercel Blob Storage (para imágenes)
CARM_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xDW0UcmfAvqYQPEh_ndz3gFikPFmqnZmRnsBsAW69ocRNGS

# Carga automática de datos en deploy (recomendado)
RUN_LOAD_DATA_ON_BUILD=true

# OAuth Google (usar credenciales de producción)
GOOGLE_CLIENT_ID=tu_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion

# NextAuth (generar nuevo secret para producción)
NEXTAUTH_SECRET=tu_super_secret_muy_largo_para_produccion
NEXTAUTH_URL=https://tu-app.vercel.app

# Owner del sistema
OWNER_EMAIL=tu_email@ejemplo.com

# Database Pool Configuration (opcional)
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_TIMEOUT=60000
DB_CONNECT_TIMEOUT=60000
DB_KEEP_ALIVE_INTERVAL=30000
```

## 🔐 Sistema de Seguridad Vercel

### **✅ Ventajas del Sistema Estándar Vercel:**

1. **Cifrado Automático**: Vercel cifra las variables de entorno automáticamente
2. **Transmisión Segura**: Variables enviadas por canal seguro
3. **Sin Logs**: Las credenciales no aparecen en logs
4. **Estándar de Industria**: Formato estándar Next.js/Prisma
5. **Simplificado**: Sin necesidad de cifrado custom

### **🔧 Cómo Funciona en Vercel:**

```bash
# Configuración flexible - Prisma usa el schema de la URL:

# Opción A: Schema específico (ej: carm)
DATABASE_URL=postgresql://user:password@host:5432/db?schema=carm
DIRECT_URL=postgresql://user:password@host:5432/db?schema=carm

# Opción B: Schema por defecto (public - más simple)
DATABASE_URL=postgresql://user:password@host:5432/db
DIRECT_URL=postgresql://user:password@host:5432/db

# Vercel automáticamente:
# 1. Cifra las variables en reposo
# 2. Las transmite por canal seguro  
# 3. No las imprime en logs
# 4. Prisma usa el schema especificado en la URL
```

## 🗄️ Base de Datos

### **📋 Opciones Recomendadas:**

1. **Neon** (PostgreSQL serverless) - Recomendado
2. **Supabase** (PostgreSQL con extras)
3. **PlanetScale** (MySQL, requiere cambios)

### **🚀 Configuración con Neon:**

1. **Crear cuenta en** [Neon](https://neon.tech)
2. **Crear proyecto** con PostgreSQL 15+
3. **Crear base de datos** llamada `carm_ranking`
4. **Obtener connection string** desde el dashboard
5. **Copiar a Vercel** como `DATABASE_URL` y `DIRECT_URL`

Ejemplo de connection string:
```
postgresql://username:password@ep-cool-cloud-123456.us-east-1.aws.neon.tech:5432/carm_ranking?schema=carm
```

## 🔑 OAuth Google

### **📋 Configuración para Producción:**

1. **Google Cloud Console**: Crear nuevo proyecto para producción
2. **Habilitar Google+ API**
3. **Crear credenciales OAuth 2.0**:
   - Tipo: Aplicación web
   - URIs autorizados: `https://tu-app.vercel.app/api/auth/callback/google`
4. **Copiar Client ID y Secret** a Vercel

## 🚀 Despliegue Paso a Paso

### **1. Preparar el Repositorio**

```bash
# Asegurate que tienes los últimos cambios
git add .
git commit -m "Preparado para Vercel con DATABASE_URL estándar"
git push origin main
```

### **2. Configurar en Vercel**

1. **Ir a** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Importar proyecto** desde GitHub
3. **Configurar variables de entorno**:

Ir a **Settings → Environment Variables** y agregar:

```bash
DATABASE_URL=postgresql://username:password@host:5432/carm_ranking?schema=carm
DIRECT_URL=postgresql://username:password@host:5432/carm_ranking?schema=carm
CARM_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xDW0UcmfAvqYQPEh_ndz3gFikPFmqnZmRnsBsAW69ocRNGS
RUN_LOAD_DATA_ON_BUILD=true
GOOGLE_CLIENT_ID=tu_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_client_secret_produccion
NEXTAUTH_SECRET=tu_super_secret_muy_largo_para_produccion
NEXTAUTH_URL=https://tu-app.vercel.app
OWNER_EMAIL=tu_email@ejemplo.com
```

### **3. Deploy y Carga Automática**

Con `RUN_LOAD_DATA_ON_BUILD=true`, durante el primer deploy se ejecuta automáticamente:

1. **Migraciones**: `npm run migrate:deploy`
2. **Carga de datos**: `npm run run:load-data` (~1 minuto)
3. **Build**: `next build`

**¡No necesitas ejecutar comandos manuales!** Todo se hace automáticamente en el build.

### **4. Verificar Deploy**

1. **Revisar logs** en Vercel Dashboard
2. **Probar conexión** a base de datos
3. **Verificar OAuth** con Google
4. **Confirmar funcionalidad** de la aplicación

## 🔍 Troubleshooting

### **❌ Error: DATABASE_URL no está configurada**
- Verificar que `DATABASE_URL` esté en Vercel Environment Variables
- Comprobar que no tenga espacios o caracteres especiales

### **❌ Error de conexión a base de datos**
- Verificar que la base de datos esté activa
- Comprobar las credenciales en el connection string
- Verificar que el schema `carm` exista

### **❌ Error de OAuth**
- Verificar que `NEXTAUTH_URL` coincida con tu dominio de Vercel
- Comprobar que los URIs de redirección estén configurados en Google Console
- Verificar que `NEXTAUTH_SECRET` esté configurado

### **❌ Error de migraciones**
- Ejecutar `npx prisma migrate deploy` desde terminal de Vercel
- Verificar que todas las migraciones estén aplicadas
- Comprobar permisos de base de datos

## 📊 Monitoreo y Performance

### **📈 Métricas Importantes:**

1. **Cold Start Time**: < 1s ideal
2. **Database Connections**: Usar pool de conexiones
3. **Memory Usage**: Optimizar queries pesadas
4. **Function Duration**: < 10s máximo

### **🔧 Optimizaciones:**

1. **Database pooling** ya configurado
2. **Keep-alive** para conexiones persistentes
3. **Query optimization** en operaciones pesadas
4. **Edge runtime** donde sea posible

## ✅ Checklist de Deploy

### **📋 Pre-Deploy:**
- [ ] Variables de entorno configuradas en Vercel
- [ ] Base de datos creada y accesible
- [ ] OAuth configurado para producción
- [ ] Código pusheado a main

### **📋 Post-Deploy:**
- [ ] Migraciones ejecutadas
- [ ] Seed data cargado
- [ ] OAuth funcionando
- [ ] Email de OWNER configurado
- [ ] Aplicación responde correctamente

### **🔍 Configuración Específica Verificada:**
- [ ] Sistema DATABASE_URL estándar funcionando
- [ ] Pool de conexiones configurado para serverless
- [ ] Tu email como OWNER configurado
- [ ] Cálculos de puntos funcionando correctamente

**¡Tu sistema está listo para Vercel con el estándar de la industria! 🎉**

## 📝 Migración desde Sistema Anterior

Si vienes del sistema JDBC + crypto anterior:

1. **Actualizar variables**: Cambiar de `JDBC_URL`, `JDBC_USER`, `JDBC_PASS` a `DATABASE_URL`
2. **Eliminar crypto**: Ya no necesitas `PRIVATE_KEY`
3. **Simplificar**: Vercel maneja toda la seguridad automáticamente
4. **Testing**: Verificar que todo funciona igual

El nuevo sistema es más simple, más estándar y igualmente seguro gracias a Vercel.