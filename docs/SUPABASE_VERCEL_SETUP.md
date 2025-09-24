# Configuración de Supabase con Vercel - Solución para Prepared Statements

## Problema: "prepared statement 's1' already exists"

Este error ocurre en entornos serverless (Vercel) con Prisma y PostgreSQL/Supabase debido a la reutilización de conexiones y prepared statements.

## Solución Implementada

Basada en la solución de Digital Ocean, implementamos un sistema de **stages** que usa diferentes URLs de conexión según el contexto:

### 1. **Variables de Entorno**

```bash
# Para desarrollo local
DATABASE_URL=postgresql://usuario:password@localhost:5432/database?schema=schema
POSTGRES_URL_NON_POOLING=postgresql://usuario:password@localhost:5432/database?schema=schema

# Para producción con Supabase
# URL directa (sin pooling) - para migraciones
DATABASE_URL_MIGRATE=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=1

# URL con pooling - para aplicación
DATABASE_URL_POOL=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=5&pgbouncer=true&prepareThreshold=0&connection_timeout=30&pool_timeout=30
```

### 2. **Scripts con Stages**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "cross-env STAGE=build npm run prisma:generate && cross-env STAGE=migrate npm run migrate:deploy && cross-env STAGE=build next build",
    "start": "cross-env STAGE=run next start",
    "postinstall": "cross-env STAGE=postinstall prisma generate"
  }
}
```

### 3. **Configuración Dinámica**

El sistema selecciona automáticamente la URL correcta:

- **STAGE=migrate**: Usa `DATABASE_URL_MIGRATE` (conexión directa, sin pooling)
- **STAGE=run/build**: Usa `DATABASE_URL_POOL` (con pooling)
- **STAGE=development**: Usa `DATABASE_URL` (desarrollo local)

### 4. **Parámetros Importantes**

#### **Para Migraciones (DATABASE_URL_MIGRATE)**
```bash
# Conexión directa sin pooling
sslmode=require
connection_limit=1
# NO incluir pgbouncer=true
```

#### **Para Aplicación (DATABASE_URL_POOL)**
```bash
# Conexión con pooling
sslmode=require
connection_limit=5
pgbouncer=true
prepareThreshold=0
connection_timeout=30
pool_timeout=30
```

### 5. **Configuración de Supabase**

En tu dashboard de Supabase:

1. **Settings** → **Database**
2. Copia la **Connection string** (URI)
3. Agrega los parámetros necesarios según el uso

**Para migraciones:**
```bash
DATABASE_URL_MIGRATE=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=1
```

**Para aplicación:**
```bash
DATABASE_URL_POOL=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=5&pgbouncer=true&prepareThreshold=0&connection_timeout=30&pool_timeout=30
```

### 6. **Variables de Entorno en Vercel**

En tu dashboard de Vercel, agrega:

```bash
# URL directa (para migraciones)
DATABASE_URL_MIGRATE=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=1

# URL con pooling (para aplicación)
DATABASE_URL_POOL=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=5&pgbouncer=true&prepareThreshold=0&connection_timeout=30&pool_timeout=30
```

## Verificación

### **Test de Configuración**
```bash
npm run test:connection-config
```

### **Test de Conexión**
```bash
# Para migraciones
cross-env STAGE=migrate npm run test:connection-config

# Para aplicación
cross-env STAGE=run npm run test:connection-config
```

## Beneficios de esta Solución

- ✅ **Elimina errores de prepared statements**
- ✅ **Usa pooling para la aplicación (mejor rendimiento)**
- ✅ **Usa conexión directa para migraciones (sin errores)**
- ✅ **Configuración automática basada en contexto**
- ✅ **Compatible con Supabase y Vercel**
- ✅ **Solución probada en Digital Ocean**

## Troubleshooting

### Error: "prepared statement 's1' already exists"

**Causa**: Usando pooling para migraciones
**Solución**: Verificar que `STAGE=migrate` use `DATABASE_URL_MIGRATE`

### Error: "Can't reach database server"

**Causa**: No usar pooling en producción
**Solución**: Verificar que `STAGE=run` use `DATABASE_URL_POOL`

### Error: "Connection timeout"

**Causa**: Timeout muy bajo o conexiones lentas
**Solución**: Aumentar `connection_timeout` y `pool_timeout`

## Flujo de Build

1. **STAGE=build**: Genera Prisma Client
2. **STAGE=migrate**: Ejecuta migraciones (conexión directa)
3. **STAGE=build**: Build de Next.js
4. **STAGE=run**: Ejecuta aplicación (con pooling)

## Referencias

- [Digital Ocean Connection Pooling](https://docs.digitalocean.com/products/databases/postgresql/how-to/manage-connection-pools/)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
