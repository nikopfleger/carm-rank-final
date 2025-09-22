# API Endpoints (visión general)

Esta app usa Next.js App Router. Las rutas se auto-descubren desde `app/api/**/route.ts`.

## 🔎 Descubrimiento rápido

```text
app/api/
  players/route.ts                → /api/players
  players/[legajo]/route.ts       → /api/players/:legajo
  games/pending/route.ts          → /api/games/pending
  games/pending/[id]/approve/route.ts → /api/games/pending/:id/approve
  games/pending/[id]/reject/route.ts  → /api/games/pending/:id/reject
  seasons/route.ts                → /api/seasons
  tournaments/route.ts            → /api/tournaments
  auth/...                        → /api/auth/* (NextAuth)
```

Para ver la lista completa, revisar el árbol de `app/api/` en el repo.

## 📤 Contrato de respuesta

```json
{
  "success": true,
  "data": [],
  "message": "",
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Errores:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detalle del error"
  }
}
```

## 🔐 Autenticación

- Endpoints bajo `/api/auth/*` son manejados por NextAuth.
- Rutas administrativas pueden exigir sesión y permisos (ver `lib/server-authorization.ts`).

## 🧪 Ejemplos rápidos

```bash
# Players (lista)
curl -s http://localhost:3000/api/players | jq .

# Player por legajo
curl -s http://localhost:3000/api/players/123 | jq .

# Juegos pendientes
curl -s http://localhost:3000/api/games/pending | jq .
```

## ⚙️ Variables de entorno

Mantener solo las esenciales aquí; el detalle vive en `README.md` y `VERCEL_SETUP.md`.

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=carm
DIRECT_URL=postgresql://user:pass@host:5432/db?schema=carm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

- Producción (Vercel/Neon): ver `VERCEL_SETUP.md` y `docs/NEON_POOLING_OPTIMIZATION.md`.

## 🔗 Referencias canónicas

- Código fuente de rutas: `app/api/**/route.ts`
- Auth: `lib/auth-vercel.ts`
- Autorización: `lib/server-authorization.ts`
- Formato i18n y mensajes: `docs/I18N_SYSTEM.md`
- Setup local/DB: `README.md` y `DATABASE_SETUP.md`
