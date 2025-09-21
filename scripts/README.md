# Scripts de CAMR

## Comandos de Contingencia y Carga de Datos

### Para uso en producción/contingencia:

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
```

## Notas Importantes

- **Contingencia**: Usa `npm run contingency` al inicio de la app para cargar datos básicos rápidamente
- **Producción**: Los scripts funcionan tanto localmente como en Vercel serverless
- **CSV**: Los datos se cargan desde `csv/CARM.csv`
- **Legajos**: Se mapean desde `data/legajos-reales-correcto.json`

## Compatibilidad Vercel

✅ Todos los scripts son compatibles con Vercel serverless:
- Usan funciones de cálculo del servidor (`lib/game-calculations.ts`)
- No dependen de APIs del cliente
- Funcionan en entorno Node.js puro