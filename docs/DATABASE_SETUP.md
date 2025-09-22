# Setup de Base de Datos PostgreSQL con Prisma - CAMR Ranking (canónico local)

> Configuración local. Para producción y variables en Vercel ver `VERCEL_SETUP.md` y `docs/NEON_POOLING_OPTIMIZATION.md`.

> **📋 Guía Relacionada**: Para instalación completa del proyecto ver [`README.md`](README.md)

## 🚀 Configuración con Prisma ORM

> **🎉 Nuevo Enfoque con Prisma**  
> Ahora usamos Prisma ORM que simplifica enormemente el manejo de la base de datos:
> - **Usuario**: `carm_admin` (con permisos específicos)
> - **Contraseña**: `carm_admin`
> - **ORM**: Prisma maneja automáticamente migraciones, tipos y queries
> - **Base de datos**: `carm_rank`

### **🔧 Beneficios de Prisma:**

| Característica | Antes (SQL manual) | Ahora (Prisma) |
|----------------|-------------------|----------------|
| **Migraciones** | Ejecutar .sql manualmente | `npm run db:migrate` automático |
| **Tipos TypeScript** | Definir interfaces manualmente | Generados automáticamente |
| **Queries** | SQL crudo | API tipo-segura |
| **Seed Data** | Insertar SQL manual | `npm run db:seed` |
| **Admin UI** | Solo psql | `npm run db:studio` (interfaz web) |

### **🔑 Cuándo usar cada herramienta:**

| Herramienta | Cuándo usar | Ejemplos |
|-------------|-------------|----------|
| `postgres` (psql) | ✅ **Solo** para setup inicial | Crear usuario `carm_admin`, crear BD `carm_rank` |
| **Prisma CLI** | ✅ **Todo el desarrollo** | Migraciones, seed, studio, deploy |
| **Prisma Studio** | ✅ **Ver/editar datos** | Interfaz web para administrar datos |

### 1. Instalar PostgreSQL

#### Windows:
```bash
# Descargar desde https://www.postgresql.org/download/windows/
# ⚠️ IMPORTANTE: Marcar "Command Line Tools" durante instalación

# Verificar instalación
psql --version
```

**🔧 Si `psql` no es reconocido en Windows:**
```cmd
# 1. Buscar ruta de instalación PostgreSQL:
C:\Program Files\PostgreSQL\15\bin
C:\Program Files\PostgreSQL\16\bin

# 2. Agregar al PATH permanentemente:
# - Buscar "Variables de entorno" en Windows
# - Editar variable PATH del sistema
# - Agregar: C:\Program Files\PostgreSQL\15\bin
# - Reiniciar PowerShell/CMD

# 3. Alternativa temporal:
set PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin

# 4. Verificar:
psql --version
```

#### macOS:
```bash
brew install postgresql
brew services start postgresql

# Verificar PATH automático
which psql
psql --version
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# psql está en /usr/bin/psql automáticamente
psql --version
```

### 2. Configurar Usuario Administrativo y Base de Datos

**Paso 2.1: Setup Inicial PostgreSQL (Una sola vez)**
```bash
# Conectarse como superusuario postgres
psql -U postgres
```

```sql
-- Crear usuario administrativo para la aplicación
CREATE USER carm_admin WITH PASSWORD 'carm_admin';

-- Crear base de datos con encoding UTF8
CREATE DATABASE carm_rank WITH 
    OWNER carm_admin 
    ENCODING 'UTF8' 
    LC_COLLATE 'en_US.UTF-8' 
    LC_CTYPE 'en_US.UTF-8';

-- Otorgar privilegios completos al usuario
GRANT ALL PRIVILEGES ON DATABASE carm_rank TO carm_admin;

-- Salir de postgres (ya no lo necesitamos más)
\q
```

**Paso 2.2: Configurar Prisma (Automático)**
```bash
# Configurar archivo .env.local
echo 'DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"' > .env.local

# Inicializar Prisma (crear tablas, relaciones, datos)
npm run db:migrate  # Crea todas las tablas automáticamente
npm run db:seed     # Poblar con datos iniciales

# Abrir interfaz web para ver los datos
npm run db:studio   # http://localhost:5555
```

> **🎉 ¡Ya está listo!** Prisma configuró todo automáticamente.

### 5. Verificar que Todo Funciona

```bash
# 1. Abrir Prisma Studio (interfaz web)
npm run db:studio

# 2. Verificar en el navegador: http://localhost:5555
# Deberías ver:
# - Tabla Country con 14 países
# - Tabla Season con temporada actual
# - Tabla Ruleset con reglas EMA
# - Tabla Location con ubicaciones

# 3. Levantar la aplicación
npm run dev

# 4. Verificar en: http://localhost:3000
```

## 🔧 **Troubleshooting Prisma**

### **Error: Environment variable not found: DATABASE_URL**

#### **🐧 Linux/macOS**
```bash
# Verificar que existe el archivo .env.local
cat .env.local

# Recrear si es necesario
echo 'DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"' > .env.local
```

#### **🪟 Windows (Problema Específico)**

**El archivo `.env.local` existe pero PowerShell no lo carga:**

```powershell
# 1. Verificar que el archivo existe
Get-Content .env.local

# 2. Solución A: Configurar variable directamente en PowerShell
$env:DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"

# 3. Verificar que se configuró
echo $env:DATABASE_URL

# 4. Ahora ejecutar comandos Prisma
npm run db:migrate
```

**Solución B: Instalar dotenv-cli (recomendado para uso frecuente):**
```powershell
# Instalar dotenv-cli globalmente
npm install -g dotenv-cli

# Usar dotenv para cargar variables
dotenv -e .env.local -- npm run db:migrate
dotenv -e .env.local -- npm run db:seed
```

### **Error: "Can't reach database server"**
```bash
# 1. Verificar que PostgreSQL esté corriendo
# Windows:
net start postgresql-x64-15

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# 2. Verificar que la BD existe
psql -U postgres -l | grep carm_rank

# 3. Crear BD si no existe
psql -U postgres
CREATE DATABASE carm_rank WITH OWNER carm_admin ENCODING 'UTF8';
\q
```

### **Error: "Migration failed"**
```bash
# Reset y volver a migrar
npm run db:reset
npm run db:migrate
npm run db:seed
```

### **Error: "Validation Error Count: 1 [Context: getConfig]"**

**🔥 Error Común en Windows**

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DATABASE_URL.
Validation Error Count: 1
[Context: getConfig]
```

**Causa**: PowerShell no carga archivos `.env.local` automáticamente.

**✅ Solución Rápida**:
```powershell
# Configurar variable de entorno en la sesión actual
$env:DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"

# Ejecutar comando Prisma
npm run db:migrate
```

**✅ Solución Permanente**: Ver solución con `dotenv-cli` arriba.

### **Error: Prisma Client out of sync**
```bash
# Regenerar cliente
npm run db:generate
```

### **Comandos Útiles para Debug**

**🔧 Con Prisma (Recomendado):**
```bash
# Ver y administrar todos los datos
npm run db:studio           # http://localhost:5555

# Información del schema
npx prisma validate         # Validar configuración
npx prisma format          # Formatear schema.prisma

# Ver el schema actual generado
npx prisma db pull          # Actualizar schema desde BD

# Logs detallados
DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank?connection_limit=5&pool_timeout=20&schema_disable_advisory_lock=true" npm run dev
```

**🆘 Si necesitas PostgreSQL directo:**
```bash
# Verificar estado
pg_isready

# Conexión directa
psql -U carm_admin -d carm_rank

# Comandos útiles dentro de psql:
\dt                    # Ver tablas
\d player             # Esquema de tabla player
SELECT version();     # Versión PostgreSQL
SELECT * FROM country LIMIT 5;  # Datos de prueba
```

## 🌐 **Configuración Multi-Entorno**

### **📊 Resumen de Entornos**

| Entorno | Base de Datos | URL | Archivo Config |
|---------|---------------|-----|----------------|
| **🔧 Desarrollo** | PostgreSQL Local | `localhost:5432` | `.env.local` |
| **🚀 Producción** | Vercel PostgreSQL | Automática | Variables Vercel |
| **🧪 Testing** | PostgreSQL Local | `localhost:5432` | `.env.test` |

### **🔧 Desarrollo Local**

```bash
# 1. Crear archivo .env.local
cp .env.example .env.local

# 2. Configurar para desarrollo local
echo 'DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"' > .env.local
echo 'NODE_ENV="development"' >> .env.local

# 3. Migrar y poblar
npm run db:migrate
npm run db:seed

# 4. Verificar
npm run db:studio  # http://localhost:5555
```

### **🚀 Producción Vercel**

```bash
# 1. Conectar base de datos en Vercel Dashboard
# Storage → Create → PostgreSQL

# 2. Variables se configuran automáticamente:
# POSTGRES_PRISMA_URL (para Prisma)
# POSTGRES_URL_NON_POOLING (para migraciones)

# 3. Deploy automático ejecuta:
# - prisma generate (en build)
# - prisma migrate deploy (si configurado)
```

## 🌐 Configuración para Vercel (Production)

### 1. Crear Base de Datos en Vercel

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña "Storage"
4. Haz clic en "Create Database"
5. Selecciona "Postgres"
6. Elige un nombre para tu base de datos
7. Selecciona la región más cercana a tus usuarios

### 2. Configurar Variables de Entorno en Vercel

Vercel configurará automáticamente estas variables cuando crees la base de datos:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

Solo necesitas agregar manualmente:
```
NEXTAUTH_SECRET=tu-clave-secreta-super-segura
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

### 3. Ejecutar Migraciones en Vercel

Después del primer deploy, ejecutar:
```bash
curl -X POST https://tu-dominio.vercel.app/api/common?action=initialize
```

## 📊 Verificación de la Configuración

### Health Check
```bash
curl http://localhost:3000/api/common?type=health
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "tablesExist": true,
    "dataExists": true,
    "errors": []
  }
}
```

### Verificar Datos Básicos
```bash
# Países
curl http://localhost:3000/api/common?type=countries

# Ubicaciones
curl http://localhost:3000/api/common?type=locations

# Reglas
curl http://localhost:3000/api/common?type=rulesets
```

## 🔧 Comandos Útiles de Desarrollo

### Conectarse a la Base de Datos
```bash
psql -U camr_user -d camr_rank -h localhost
```

### Ver Tablas
```sql
\dt
```

### Ver Datos de una Tabla
```sql
SELECT * FROM player LIMIT 5;
SELECT * FROM country;
SELECT * FROM season;
```

### Resetear Base de Datos (⚠️ CUIDADO)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO camr_user;
```

Luego ejecutar nuevamente el schema.sql.

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Verificar que el schema.sql se haya ejecutado correctamente
- Verificar permisos del usuario

### Error de Conexión
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en .env.local
- Verificar que el puerto 5432 esté disponible

### Error: "permission denied"
```sql
-- Ejecutar como superusuario
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO camr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO camr_user;
```

### Logs de la Aplicación
Los errores de base de datos aparecerán en la consola de Next.js:
```bash
npm run dev
```

## 📝 Próximos Pasos

1. **Configurar la base de datos** siguiendo esta guía
2. **Ejecutar la aplicación** con `npm run dev`
3. **Verificar la conexión** visitando `/api/common?type=health`
4. **Inicializar datos** con `/api/common?action=initialize`
5. **Comenzar a usar** las funcionalidades del admin

## 🔐 Consideraciones de Seguridad

- ✅ **Nunca** commitear el archivo `.env.local`
- ✅ Usar contraseñas seguras en producción
- ✅ Configurar SSL en producción
- ✅ Limitar acceso a la base de datos por IP en producción
- ✅ Usar variables de entorno en Vercel/producción

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verificar los logs de la aplicación
2. Revisar la respuesta de `/api/common?type=health`
3. Verificar que PostgreSQL esté corriendo
4. Revisar las credenciales en `.env.local`
