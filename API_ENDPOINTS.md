# API Endpoints - CAMR Ranking System

## 📋 **Endpoints Principales**

### **🎮 Players**
- `GET /api/players` - Lista de jugadores con ranking
- `GET /api/players/[legajo]` - Jugador específico por legajo
- `POST /api/players` - Crear nuevo jugador

### **🎯 Games**
- `GET /api/games/pending` - Juegos pendientes de validación
- `POST /api/games/submit-pending` - Enviar juego para validación
- `POST /api/games/pending/[id]/approve` - Aprobar juego
- `POST /api/games/pending/[id]/reject` - Rechazar juego

### **🏆 Seasons & Tournaments**
- `GET /api/seasons` - Lista de temporadas
- `GET /api/tournaments` - Lista de torneos

### **🔐 Auth**
- `GET /api/auth/signin` - Página de login
- `POST /api/auth/signin` - Proceso de autenticación

## 📊 **Respuestas Estándar**

```json
{
  "success": true,
  "data": [...],
  "total": 34,
  "message": "Operación exitosa"
}
```

## 🔧 **Variables de Entorno**

```env
# Base de datos (formato estándar Vercel/Prisma)
DATABASE_URL=postgresql://username:password@localhost:5432/carm_ranking?schema=carm
DIRECT_URL=postgresql://username:password@localhost:5432/carm_ranking?schema=carm

# OAuth con Google
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret_aqui_muy_largo_y_seguro
NEXTAUTH_URL=http://localhost:3000

# Puerto del servidor
PORT=3000

# Owner
OWNER_EMAIL=tu_email_aqui
```

**Nota**: Para la configuración completa de variables de entorno, ver [README.md](./README.md#-variables-de-entorno-env).

## 📚 **Documentación Completa**

Para ejemplos detallados y casos de uso específicos, consultar la documentación de cada endpoint en el código fuente.
