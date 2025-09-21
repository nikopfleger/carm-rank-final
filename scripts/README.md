# Scripts de CAMR

## 🚀 **Carga Automática en Vercel (Recomendada)**

Con el nuevo sistema, los datos se cargan automáticamente en el deploy de producción:

```bash
# Se ejecuta automáticamente en Vercel cuando:
# RUN_LOAD_DATA_ON_BUILD=true (variable de entorno)
npm run run:load-data  # Seed + CSV completo
```

## Comandos Manuales (Desarrollo/Contingencia)

### Para uso en desarrollo local:

```bash
# Contingencia rápida - resetea DB y carga primeros 50 juegos
npm run contingency

# Carga limitada - resetea DB y carga primeros 100 juegos  
npm run reset-and-load-limited

# Carga completa - resetea DB y carga todos los juegos desde CSV
npm run reset-and-load

# Solo recalcular puntos de juegos existentes (sin resetear)
npm run recalculate
```

### Otros comandos útiles:

```bash
# Solo resetear base de datos (sin cargar datos)
npm run reset

# Solo seed básico (usuarios, configuraciones)
npm run db:seed

# Solo carga de datos (equivale al comando automático de Vercel)
npm run run:load-data
```

## 🔧 **Sistema de Carga Automática**

### **En Vercel (Producción):**
1. Durante `npm run build`, se ejecuta `scripts/run-load-data-if-needed.mjs`
2. Solo corre si: `VERCEL=true` + `VERCEL_ENV=production` + `RUN_LOAD_DATA_ON_BUILD=true`
3. Ejecuta: `npm run run:load-data` (seed + CSV completo)
4. Tarda ~1 minuto en completarse

### **En Desarrollo Local:**
- El build normal (`npm run build`) NO ejecuta la carga de datos
- Usa comandos manuales según necesites

## Variables de Entorno Necesarias

```bash
# Solo en Vercel Production Environment Variables:
RUN_LOAD_DATA_ON_BUILD=true
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
# ... resto de variables
```

## Notas Importantes

- **Automático**: En producción se carga automáticamente en el primer deploy
- **CSV**: Los datos se cargan desde `csv/CARM.csv` (incluido en el repo)
- **Legajos**: Se mapean desde `data/legajos-reales-correcto.json`
- **Seguro**: Solo ejecuta en producción con flag explícito

## Compatibilidad Vercel

✅ Todos los scripts son compatibles con Vercel serverless:
- Usan funciones de cálculo del servidor (`lib/game-calculations.ts`)
- No dependen de APIs del cliente
- Funcionan en entorno Node.js puro
- Carga automática integrada en el build process