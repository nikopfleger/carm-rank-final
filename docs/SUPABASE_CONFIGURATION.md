# Configuración de Supabase para CARM Rank

## Variables de Entorno Requeridas

Para usar Supabase en lugar de las URLs directas de PostgreSQL, necesitas configurar las siguientes variables en tu archivo `.env`:

### Variables Principales de Supabase

```bash
# URL principal con pooling (para aplicación)
POSTGRES_URL=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=5&pgbouncer=true&prepareThreshold=0&connection_timeout=30&pool_timeout=30

# URL directa sin pooling (para migraciones)
POSTGRES_URL_NON_POOLING=postgresql://postgres:[password]@[host]:5432/postgres?schema=public&sslmode=require&connection_limit=1

# Variables adicionales de Supabase
SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

## Cómo Obtener las Variables de Supabase

1. **Ve a tu proyecto en Supabase Dashboard**
2. **Settings > Database**
3. **Copia las URLs de conexión:**
   - **Connection pooling**: Usa esta para `POSTGRES_URL`
   - **Direct connection**: Usa esta para `POSTGRES_URL_NON_POOLING`

4. **Settings > API:**
   - **Project URL**: Para `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: Para `SUPABASE_JWT_SECRET`

## Configuración Actual

El sistema ahora está configurado para:

- **Migraciones**: Usar `POSTGRES_URL_NON_POOLING` (conexión directa)
- **Aplicación**: Usar `POSTGRES_URL` (con pooling)
- **Fallback**: Si no están disponibles, usar `DATABASE_URL`

## Verificación

Para verificar que la configuración funciona:

```bash
# Probar conexión
npx prisma db push

# Generar cliente
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

## Notas Importantes

- Las variables `POSTGRES_URL` y `POSTGRES_URL_NON_POOLING` son las que usa Supabase
- El sistema mantiene compatibilidad con `DATABASE_URL` como fallback
- Para migraciones, siempre se usa la conexión directa (sin pooling)
- Para la aplicación, se usa la conexión con pooling para mejor rendimiento
