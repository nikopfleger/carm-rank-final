# 🪟 Guía Específica para Windows - CAMR Ranking (referencia)

> Optimizada para entorno local Windows. Para deploy ver `VERCEL_SETUP.md`.

## 🚨 **Problema Principal: Variables de Entorno**

Windows PowerShell **NO carga automáticamente** archivos `.env.local` como lo hace bash en Linux/macOS.

### **⚠️ Error Típico**

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DATABASE_URL.
Validation Error Count: 1
[Context: getConfig]
```

**Causa**: Prisma no puede leer `DATABASE_URL` porque PowerShell no carga `.env.local`.

## ✅ **Soluciones para Windows**

### **🚀 Solución 1: Scripts Específicos para Windows (Recomendado)**

#### **Setup Inicial (una vez)**
```powershell
# Instalar dotenv-cli globalmente
npm install -g dotenv-cli

# Verificar instalación
dotenv --version
```

#### **Comandos de Desarrollo**
```powershell
# Usar scripts específicos para Windows
npm run db:migrate:win     # Migrar base de datos
npm run db:seed:win       # Poblar con datos
npm run db:studio:win     # Abrir administrador web
```

### **🔧 Solución 2: Configuración Manual**

```powershell
# Configurar variable en la sesión actual de PowerShell
$env:DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"

# Verificar que se configuró
echo $env:DATABASE_URL

# Ahora usar comandos normales
npm run db:migrate
npm run db:seed
npm run db:studio
```

### **⚡ Solución 3: Perfil de PowerShell (Permanente)**

```powershell
# Crear perfil de PowerShell (si no existe)
if (!(Test-Path -Path $PROFILE)) {
  New-Item -ItemType File -Path $PROFILE -Force
}

# Agregar configuración al perfil
Add-Content -Path $PROFILE -Value '$env:DATABASE_URL="postgresql://carm_admin:carm_admin@localhost:5432/carm_rank"'

# Recargar perfil
. $PROFILE
```

## 📋 **Scripts NPM Específicos para Windows**

El proyecto incluye scripts específicos para Windows que usan `dotenv-cli`:

```json
{
  "scripts": {
    "db:migrate:win": "dotenv -e .env.local -- prisma migrate dev",
    "db:seed:win": "dotenv -e .env.local -- tsx prisma/seed.ts",
    "db:studio:win": "dotenv -e .env.local -- prisma studio"
  }
}
```

## 🔄 **Flujo de Desarrollo en Windows**

### **Setup Inicial**
```powershell
# 1. Clonar e instalar
git clone https://github.com/nicolas-webdev/camr-rank.git
cd camr-rank
npm install

# 2. Instalar dotenv-cli
npm install -g dotenv-cli

# 3. Configurar base de datos (usar psql desde PATH o ruta completa)
psql -U postgres
# Ejecutar SQL de creación de usuario y BD

# 4. Configurar environment
cp .env.example .env.local
# Editar .env.local con credenciales

# 5. Migrar y poblar
npm run db:migrate:win
npm run db:seed:win
```

### **Desarrollo Diario**
```powershell
# Levantar aplicación (Next.js carga .env.local automáticamente)
npm run dev

# Administrar base de datos
npm run db:studio:win

# Si necesitas comandos Prisma directos
dotenv -e .env.local -- npx prisma [comando]
```

## 🛠️ **Troubleshooting Windows**

### **Error: 'dotenv' no es reconocido**
```powershell
# Verificar instalación global
npm list -g dotenv-cli

# Reinstalar si es necesario
npm uninstall -g dotenv-cli
npm install -g dotenv-cli
```

### **Error: 'psql' no es reconocido**
```powershell
# Agregar PostgreSQL al PATH (temporal)
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"

# O usar ruta completa
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

### **Error: No se puede conectar a PostgreSQL**
```powershell
# Verificar servicio corriendo
Get-Service -Name postgresql*

# Iniciar si está detenido
Start-Service postgresql-x64-15
```

### **Verificar configuración**
```powershell
# Ver contenido de .env.local
Get-Content .env.local

# Verificar variable cargada
echo $env:DATABASE_URL

# Test de conexión manual
dotenv -e .env.local -- npx prisma db pull
```

## 🎯 **Mejores Prácticas Windows**

1. **✅ Usar scripts `:win`** para desarrollo local
2. **✅ Configurar PATH** de PostgreSQL permanentemente
3. **✅ Usar PowerShell** como administrador si hay problemas de permisos
4. **✅ Mantener dotenv-cli** actualizado
5. **⚠️ No commitear** archivos `.env.*`
6. **📁 Usar rutas absolutas** si hay problemas con PATH

## 🚀 **Alternativa: WSL2 (Avanzado)**

Si prefieres un entorno más similar a Linux:

```bash
# Instalar WSL2 + Ubuntu
wsl --install

# Desarrollar desde WSL2
cd /mnt/c/tu-proyecto
npm run db:migrate    # Funciona como en Linux
```

## 🎉 **¡Todo Listo para Windows!**

Con estas configuraciones, el desarrollo en Windows será tan fluido como en Linux/macOS. Los scripts específicos para Windows (`:win`) manejan automáticamente la carga de variables de entorno.

**¡Happy coding desde Windows! 🪟🚀**
