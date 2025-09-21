# 🀄 CAMR Ranking System

Sistema de ranking oficial para la **Comunidad Argentina de Riichi Mahjong** (CAMR).

## 🧰 Comandos disponibles (npm scripts)

```bash
# Desarrollo / build
npm run dev                 # Iniciar en modo desarrollo
npm run build               # Generar build (incluye prisma generate)
npm run start               # Levantar build
npm run lint                # Lint de Next/ESLint
npm run lint:css-modules    # Validar CSS Modules

# Base de datos (Prisma)
npm run db:generate         # Generar cliente Prisma
npm run db:push             # Sin migraciones, sincroniza schema con la DB
npm run db:migrate          # Crear/aplicar migraciones en dev
npm run db:migrate:prod     # Aplicar migraciones en prod
npm run db:reset            # Reset de esquema (borra datos) y aplica schema
npm run db:seed             # Seed de datos base
npm run db:studio           # Prisma Studio

# Carga de datos
npm run reset               # Reset + seed (configuraciones base)
npm run reset-and-load      # Reset + seed + carga CSV completa
npm run contingency         # Reset + seed + primeros 50 juegos (contingencia rápida)
npm run recalculate         # Solo recalcular puntos (sin resetear)

# Nota: Sistema simplificado - ahora usamos DATABASE_URL estándar sin cifrado custom
```

## 🛠️ Requisitos

### **📋 Prerrequisitos del Sistema**

Antes de comenzar, asegúrate de tener instalado:

#### **🔧 Herramientas de Desarrollo:**
- **[Node.js](https://nodejs.org/)** (versión 18 o superior)
- **[Git](https://git-scm.com/)** para control de versiones
- **[VS Code](https://code.visualstudio.com/)** o **[Cursor](https://cursor.sh/)** como editor
- **[PostgreSQL](https://www.postgresql.org/)** (versión 13 o superior)

#### **🗄️ Instalación y Configuración de PostgreSQL:**

### **📥 Instalación de PostgreSQL:**

1. **Windows:**
   - Ir a [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Descargar el instalador oficial
   - Ejecutar el instalador y seguir el asistente
   - **Importante**: Recordar la contraseña del usuario `postgres` que configures
   - Al finalizar, se instalará **pgAdmin** (interfaz gráfica)

2. **macOS:**
   - **Opción 1 (Recomendada)**: Descargar desde [postgresql.org/download/macosx/](https://www.postgresql.org/download/macosx/)
   - **Opción 2**: Usar Homebrew: `brew install postgresql`
   - **Opción 3**: Usar Postgres.app desde [postgresapp.com](https://postgresapp.com/)

3. **Linux (Ubuntu/Debian):**
   - Abrir terminal y ejecutar:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

### **🔧 Configuración Inicial (GUI):**

1. **Abrir pgAdmin** (Windows/macOS) o **psql** (Linux)

2. **Crear usuario específico:**
   - **Con pgAdmin**: Click derecho en "Login/Group Roles" → "Create" → "Login/Group Role"
     - General tab: Name: `carm_admin`
     - Definition tab: Password: `tu_password_aqui`
     - Privileges tab: Marcar "Can login?" y "Superuser?"
   - **Con psql**: 
     ```sql
     CREATE USER carm_admin WITH PASSWORD 'tu_password_aqui';
     ```

3. **Crear la base de datos con el usuario como owner:**
   - **Con pgAdmin**: Click derecho en "Databases" → "Create" → "Database"
     - Name: `carm_ranking`
     - Owner: `carm_admin` (seleccionar del dropdown)
     - **Definition tab**: 
       - Encoding: `UTF8`
       - Collation: `C`
       - Character type: `C`
   - **Con psql**: 
     ```sql
     CREATE DATABASE carm_ranking 
     OWNER carm_admin 
     ENCODING 'UTF8' 
     LC_COLLATE 'C' 
     LC_CTYPE 'C';
     ```

4. **Crear el schema:**
   - **Con pgAdmin**: Expandir `carm_ranking` → Click derecho en "Schemas" → "Create" → "Schema"
     - Name: `carm`
     - Owner: `carm_admin`
   - **Con psql**:
     ```sql
     \c carm_ranking
     CREATE SCHEMA carm;
     ```

## 🚶 Guía paso a paso (primera vez)

```bash
# 1) Clonar y preparar dependencias
git clone https://github.com/nicolas-webdev/camr-rank.git
cd camr-rank
npm install

# 2) Configurar base de datos (si no la creaste manualmente)
createuser carm_admin --pwprompt      # contraseña sugerida: carm_admin
createdAtb carm_ranking --owner=carm_admin

# 3) Variables de entorno
cp env.example .env.local
# Editar .env.local con credenciales de DB, OAuth, email, etc.

# 4) Inicializar base de datos
npm run db:migrate
npm run db:seed

# 5) (Opcional) Cargar datos desde CSV
# Esto resetea, aplica seed y luego carga CSV (rápido para dejar todo listo)
npm run reset-and-load

# 6) Levantar la app
npm run dev
```

Aplicación: http://localhost:3000  
Admin: http://localhost:3000/admin

## ⚙️ **Configuración Detallada**

### **🔐 Configuración de OAuth con Google**

1. **Crear proyecto en Google Cloud Console:**
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear nuevo proyecto o seleccionar existente
   - Habilitar Google+ API

2. **Configurar OAuth 2.0:**
   - Ir a "APIs y servicios" → "Credenciales"
   - Crear credenciales → "ID de cliente OAuth 2.0"
   - Tipo de aplicación: "Aplicación web"
   - URIs de redirección autorizados: `http://localhost:3000/api/auth/callback/google`

3. **Configurar las variables en tu archivo .env** (ver sección de variables de entorno más abajo)

### **👤 Configuración de Owner**

El owner se crea automáticamente en el primer inicio de la aplicación usando la variable `OWNER_EMAIL` de tu archivo .env.

## 🛠️ **Troubleshooting Común**

### **❌ Problemas de Conexión a Base de Datos**

**Error: "Connection refused"**
- **Windows**: Verificar que el servicio PostgreSQL esté corriendo
  - Abrir "Servicios" (services.msc)
  - Buscar "postgresql-x64-13" y asegurarse que esté "En ejecución"
  - Si no está, click derecho → "Iniciar"
- **macOS**: Abrir Postgres.app o ejecutar `brew services start postgresql`
- **Linux**: Ejecutar `sudo systemctl start postgresql`

**Error: "Database does not exist"**
- **Con pgAdmin**: Click derecho en "Databases" → "Create" → "Database" → Name: `carm_ranking`, Owner: `carm_admin`, Encoding: `UTF8`, Collation: `C`
- **Con psql**: `psql -U postgres` → `CREATE DATABASE carm_ranking OWNER carm_admin ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';`

**Error: "Schema does not exist"**
- **Con pgAdmin**: Expandir `carm_ranking` → Click derecho en "Schemas" → "Create" → "Schema" → Name: `carm`
- **Con psql**: `\c carm_ranking` → `CREATE SCHEMA carm;`

### **❌ Problemas de Migraciones**

**Error: "Migration failed"**
```bash
# Resetear y aplicar migraciones
npm run db:reset
npm run db:migrate
npm run db:seed
```

**Error: "Prisma client not generated"**
```bash
# Regenerar cliente Prisma
npm run db:generate
```

### **❌ Problemas de OAuth**

**Error: "Invalid client"**
- Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctos
- Verificar que la URI de redirección sea exactamente: `http://localhost:3000/api/auth/callback/google`

**Error: "NextAuth secret not set"**
```bash
# Generar un secret seguro
openssl rand -base64 32
# Copiar el resultado a NEXTAUTH_SECRET
```

### **❌ Problemas de Puerto**

**Error: "Port 3000 already in use"**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### **❌ Problemas de Dependencias**

**Error: "Module not found"**
```bash
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install
```

**Error: "Prisma generate failed"**
```bash
# Regenerar cliente Prisma
npx prisma generate
```

## 📦 Opciones de carga de datos

### 🚀 **Para Producción/Vercel:**
- **Contingencia rápida**: `npm run contingency` (50 juegos)
- **Carga limitada**: `npm run reset-and-load-limited` (100 juegos)
- **Carga completa**: `npm run reset-and-load` (todos los juegos)

### 🔧 **Para Desarrollo:**
- **Solo configuraciones**: `npm run reset`
- **Solo recalcular**: `npm run recalculate`

### ✅ **Compatibilidad Vercel Serverless:**
Todos los scripts son completamente compatibles con Vercel serverless. No requieren modificaciones adicionales.

Para comandos directos y combinaciones (flags), ver `scripts/README.md`.

## 🚀 **Despliegue en Vercel**

### **📋 Preparación:**
1. **Configurar variables de entorno** en Vercel Dashboard
2. **Base de datos PostgreSQL** en la nube (Neon, Supabase, etc.)
3. **Ejecutar contingencia** después del primer deploy

### **🔧 Variables de Entorno para Vercel:**
```bash
# Base de datos (usar servicio cloud como Neon/Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=carm

# OAuth Google
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# NextAuth
NEXTAUTH_SECRET=tu_secret_muy_largo_y_seguro
NEXTAUTH_URL=https://tu-app.vercel.app

# Owner
OWNER_EMAIL=tu_email@ejemplo.com
OWNER_NAME=Tu Nombre

# Opcional: Configuración de pool
DB_POOL_MAX=10
DB_POOL_TIMEOUT=60000
```

### **🎯 Primer Deploy:**
1. Deploy automático desde GitHub
2. Configurar variables de entorno
3. Ejecutar: `npm run contingency` (desde Vercel CLI o re-deploy)

### **✅ Funcionalidades Serverless:**
- ✅ Cálculos de juego (API routes)
- ✅ Carga de datos (scripts)
- ✅ Autenticación OAuth
- ✅ Base de datos Prisma
- ✅ Imágenes y archivos estáticos

## 🔐 Autenticación

- Login: `/auth/signin`
- Primer usuario: SUPER_ADMIN automático
- Roles: SUPER_ADMIN, ADMIN, MODERATOR, USER

## 📚 Documentación

- APIs: `API_ENDPOINTS.md`
- Sistema de Badges: `docs/RANK_BADGES_SYSTEM.md`
- Tipografía: `docs/TYPOGRAPHY_SYSTEM.md`
- Internacionalización: `docs/I18N_SYSTEM.md`
- Colores: `docs/COLOR_SYSTEM.md`

## 🤝 Contribuir

1. Crear una branch por feature
2. Commits claros y pequeños
3. Abrir Pull Request

## 👑 Super Admin Automático

El sistema maneja super admins con configuración simple:

### 🔐 **Configuración:**
```bash
OWNER_EMAIL=admin@ejemplo.com
OWNER_NAME=Super Admin
```

### 🚀 **Comportamiento:**
- **Primer arranque**: Crea owner con `OWNER_EMAIL` y `OWNER_NAME`
- **Login Google**: Si el email coincide con `OWNER_EMAIL`, se convierte en OWNER
- **Usuarios nuevos**: Si no coincide, se crean como USER normal

## 🔧 **Variables de Entorno (.env)**

### 🔧 **Configuración Completa del .env:**

**Formato estándar Vercel/Prisma** (recomendado para desarrollo y producción):

```bash
# Database URLs (formato estándar)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name?schema=carm
DIRECT_URL=postgresql://username:password@localhost:5432/database_name?schema=carm

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_TIMEOUT=60000
DB_CONNECT_TIMEOUT=60000
DB_KEEP_ALIVE_INTERVAL=30000

# OAuth con Google
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret_aqui_muy_largo_y_seguro
NEXTAUTH_URL=http://localhost:3000

# Puerto del servidor
PORT=3000

# Owner (se crea automáticamente en el primer inicio)
OWNER_EMAIL=tu_email_aqui
```

### 🛡️ **Seguridad en Vercel:**
- **Variables en Vercel**: Configurar `DATABASE_URL` y `DIRECT_URL` en Vercel → Settings → Environment Variables
- **Cifrado automático**: Vercel cifra las variables de entorno en reposo y en tránsito
- **Sin credenciales en repo**: El archivo `.env` está en `.gitignore` 
- **Logs seguros**: Las variables no se imprimen en logs de Vercel

### 📝 **Migración desde JDBC:**
Si vienes del sistema anterior con JDBC/crypto:
1. Reemplaza `JDBC_URL`, `JDBC_USER`, `JDBC_PASS` por `DATABASE_URL` 
2. Elimina `PRIVATE_KEY` (ya no necesaria)
3. En Vercel, configura `DATABASE_URL` con las credenciales reales
4. Para desarrollo local, usa `.env` con credenciales de desarrollo

## 📄 Licencia

Uso interno para CAMR (Comunidad Argentina de Riichi Mahjong).

—

Hecho con ❤️ para la comunidad CAMR