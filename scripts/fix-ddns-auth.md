# 🔧 Solución para Error de Autenticación DDNS

## ❌ Problema Detectado
```
UntrustedHost: Host must be trusted. URL was: https://carm-ranking.ddns.net/api/auth/session
```

## ✅ Solución

### 1. Variables de Entorno (.env)
Crea/actualiza tu archivo `.env` con:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://carm-ranking.ddns.net
NEXTAUTH_SECRET=tu-secreto-muy-largo-y-seguro-aqui-minimo-32-caracteres

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Database (ya configurada)
DATABASE_URL=tu-database-url

# Owner (ya configurada)
OWNER_EMAIL=nikopfleger@gmail.com
```

### 2. Configuración de Google OAuth Console

Ve a [Google Cloud Console](https://console.cloud.google.com/):

1. **APIs & Services** → **Credentials**
2. Edita tu **OAuth 2.0 Client ID**
3. En **Authorized redirect URIs**, agrega:
   ```
   https://carm-ranking.ddns.net/api/auth/callback/google
   ```
4. En **Authorized JavaScript origins**, agrega:
   ```
   https://carm-ranking.ddns.net
   ```

### 3. Reiniciar Aplicación
Después de cambiar las variables de entorno:
```bash
# Si usas PM2
pm2 restart carm-rank

# Si usas npm/node directamente
# Ctrl+C y luego npm run start
```

### 4. Verificar Configuración
1. Ve a: `https://carm-ranking.ddns.net/api/auth/providers`
2. Deberías ver la configuración de Google sin errores

## 🔍 Diagnóstico Adicional

Si el problema persiste, verifica:

1. **DNS**: `nslookup carm-ranking.ddns.net`
2. **SSL**: El certificado debe ser válido
3. **Firewall**: Puerto 443 abierto
4. **Variables**: `echo $NEXTAUTH_URL` en el servidor

## 📝 Notas Importantes

- ✅ Ya agregamos `trustHost: true` en la configuración
- ✅ El código está preparado para DDNS dinámico
- ⚠️ Asegúrate de que el dominio DDNS esté actualizado
- ⚠️ Google OAuth puede tardar unos minutos en actualizar
