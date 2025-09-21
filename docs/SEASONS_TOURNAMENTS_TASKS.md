# Plan de Mejoras: Sistema de Temporadas y Torneos

## 🎯 Objetivo General
Mejorar el sistema de gestión de temporadas y torneos con flujos de cierre automatizados, confirmaciones de seguridad y mejor UX.

## 📋 Estado Actual Analizado

### ✅ **Ya Implementado**
- ✅ Creación de temporadas y torneos (ABM)
- ✅ Activación básica de temporadas (`setSeasonAsActive`)
- ✅ Modelo `SeasonResult` en base de datos
- ✅ Modelo `TournamentResult` en base de datos
- ✅ API básica para gestión de temporadas
- ✅ Reset básico de `seasonPoints` al activar temporada
- ✅ Cálculo de puntos de torneo en `Points` con `tournamentId`

### ❌ **Faltante Crítico**
- ❌ Confirmación de cierre de temporada con popup
- ❌ Guardado completo en `SeasonResult` (todos los campos season_*)
- ❌ Reset completo de campos season en `PlayerRanking`
- ❌ Flujo de finalización de torneos automático/manual
- ❌ Guardado en `TournamentResult` al cerrar torneo
- ❌ Confirmaciones de seguridad para operaciones críticas
- ❌ UX mejorado para estados de temporadas/torneos

---

## 🚀 **FASE 1: Sistema de Temporadas Mejorado**

### **Tarea 1.1: Modal de Confirmación de Cierre de Temporada**
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 4 horas

**Descripción:**
Crear modal de confirmación elegante cuando se cierra una temporada activa.

**Componentes a crear:**
```typescript
// components/admin/season-close-modal.tsx
interface SeasonCloseModalProps {
  isOpen: boolean;
  currentSeason: Season;
  newSeason: Season;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

**UX Flow:**
1. Usuario hace clic en "Activar" nueva temporada
2. Si hay temporada activa → Modal de confirmación
3. Modal muestra:
   - ⚠️ "¿Cerrar temporada actual?"
   - 📊 Estadísticas de la temporada actual
   - 🎯 Nueva temporada que se activará
   - ⚡ "Esta acción guardará los resultados finales"
4. Botones: "Cancelar" | "Cerrar y Activar Nueva"

### **Tarea 1.2: API de Cierre Completo de Temporada**
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 6 horas

**Endpoint:** `POST /api/seasons/[id]/close`

**Lógica a implementar:**
```typescript
async function closeSeason(seasonId: number, newSeasonId: number) {
  await prisma.$transaction(async (tx) => {
    // 1. Guardar resultados finales en SeasonResult
    const rankings = await tx.playerRanking.findMany({
      where: { /* todos los jugadores */ }
    });
    
    for (const ranking of rankings) {
      // Crear SeasonResult para 4p
      await tx.seasonResult.create({
        data: {
          seasonId,
          playerId: ranking.playerId,
          isSanma: false,
          seasonTotalGames: ranking.seasonTotalGames,
          seasonAveragePosition: ranking.seasonAveragePosition,
          seasonFirstPlaceH: ranking.seasonFirstPlaceH,
          seasonSecondPlaceH: ranking.seasonSecondPlaceH,
          seasonThirdPlaceH: ranking.seasonThirdPlaceH,
          seasonFourthPlaceH: ranking.seasonFourthPlaceH,
          seasonFirstPlaceT: ranking.seasonFirstPlaceT,
          seasonSecondPlaceT: ranking.seasonSecondPlaceT,
          seasonThirdPlaceT: ranking.seasonThirdPlaceT,
          seasonFourthPlaceT: ranking.seasonFourthPlaceT,
        }
      });
      
      // Crear SeasonResult para 3p si hay datos
      if (ranking.isSanma) {
        // Similar para sanma
      }
    }
    
    // 2. Reset campos season en PlayerRanking
    await tx.playerRanking.updateMany({
      data: {
        seasonPoints: 0,
        seasonTotalGames: 0,
        seasonAveragePosition: 0,
        seasonFirstPlaceH: 0,
        seasonSecondPlaceH: 0,
        seasonThirdPlaceH: 0,
        seasonFourthPlaceH: 0,
        seasonFirstPlaceT: 0,
        seasonSecondPlaceT: 0,
        seasonThirdPlaceT: 0,
        seasonFourthPlaceT: 0,
      }
    });
    
    // 3. Cerrar temporada actual
    await tx.season.update({
      where: { id: seasonId },
      data: { 
        isActive: false,
        endDate: new Date()
      }
    });
    
    // 4. Activar nueva temporada
    await tx.season.update({
      where: { id: newSeasonId },
      data: { isActive: true }
    });
  });
}
```

### **Tarea 1.3: Integración Frontend-Backend**
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 3 horas

**Actualizar componentes:**
- `components/admin/season-management.tsx`
- `app/admin/abm/seasons/page.tsx`

**Flow integrado:**
1. Botón "Activar" → Verificar si hay temporada activa
2. Si hay activa → Mostrar modal de confirmación
3. Al confirmar → Llamar API de cierre completo
4. Mostrar loading y resultado
5. Actualizar lista de temporadas

---

## 🏆 **FASE 2: Sistema de Torneos Mejorado**

### **Tarea 2.1: Detección Automática de Estado de Torneo**
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 4 horas

**Estados de torneo:**
```typescript
type TournamentStatus = 
  | 'upcoming'    // startDate > hoy
  | 'ongoing'     // startDate <= hoy <= endDate
  | 'completed'   // endDate < hoy
  | 'pending'     // endDate < hoy pero sin TournamentResults
```

**Componente:** `components/tournaments/tournament-status-badge.tsx`

**Lógica de cálculo:**
```typescript
function getTournamentStatus(tournament: Tournament): TournamentStatus {
  const now = new Date();
  const start = new Date(tournament.startDate);
  const end = tournament.endDate ? new Date(tournament.endDate) : null;
  
  if (start > now) return 'upcoming';
  if (!end) return 'ongoing';
  if (end >= now) return 'ongoing';
  
  // Verificar si tiene resultados
  const hasResults = tournament.tournamentResults?.length > 0;
  return hasResults ? 'completed' : 'pending';
}
```

### **Tarea 2.2: Modal de Finalización de Torneo**
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 5 horas

**Componente:** `components/admin/tournament-finalize-modal.tsx`

**UX Flow:**
1. Torneo en estado 'pending' → Mostrar botón "Finalizar Torneo"
2. Modal de confirmación:
   - 🏆 "Finalizar Torneo: [Nombre]"
   - 📅 Fechas del torneo
   - 👥 Participantes detectados
   - ⚠️ "Esta acción calculará los resultados finales"
   - 💾 "Se creará backup automático"
3. Botones: "Cancelar" | "Finalizar Torneo"

### **Tarea 2.3: API de Finalización de Torneo**
**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 6 horas

**Endpoint:** `POST /api/tournaments/[id]/finalize`

**Lógica:**
```typescript
async function finalizeTournament(tournamentId: number) {
  await prisma.$transaction(async (tx) => {
    // 1. Obtener todos los puntos de temporada del torneo
    const tournamentPoints = await tx.points.findMany({
      where: { 
        tournamentId,
        pointsType: 'SEASON'
      },
      include: { player: true }
    });
    
    // 2. Agrupar por jugador y calcular totales
    const playerTotals = new Map();
    for (const point of tournamentPoints) {
      const current = playerTotals.get(point.playerId) || 0;
      playerTotals.set(point.playerId, current + point.value);
    }
    
    // 3. Ordenar por puntos y asignar posiciones
    const sortedPlayers = Array.from(playerTotals.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([playerId, points], index) => ({
        playerId,
        points,
        position: index + 1
      }));
    
    // 4. Crear TournamentResults
    for (const result of sortedPlayers) {
      await tx.tournamentResult.create({
        data: {
          tournamentId,
          playerId: result.playerId,
          position: result.position,
          pointsWon: result.points,
          // prizeWon se puede calcular según posición
        }
      });
    }
    
    // 5. Marcar torneo como completado
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { isCompleted: true }
    });
  });
}
```

---

## 🔒 **FASE 3: Seguridad y Backup**

### **Tarea 3.1: Sistema de Confirmaciones Múltiples**
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 3 horas

**Componente:** `components/admin/critical-action-modal.tsx`

**Para acciones críticas:**
- Cierre de temporada
- Finalización de torneo
- Reset de datos

**UX:**
1. Modal inicial con información
2. Checkbox: "Entiendo que esta acción es irreversible"
3. Input de confirmación: "Escriba 'CONFIRMAR' para continuar"
4. Botón habilitado solo cuando ambos están completos

### **Tarea 3.2: Logging de Operaciones Críticas**
**Prioridad:** 🟡 Media  
**Tiempo estimado:** 2 horas

**Tabla:** `AuditLog`
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL, -- 'CLOSE_SEASON', 'FINALIZE_TOURNAMENT'
  entity_type VARCHAR(50) NOT NULL, -- 'Season', 'Tournament'
  entity_id INTEGER NOT NULL,
  user_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Registrar:**
- Quién ejecutó la acción
- Cuándo se ejecutó
- Datos antes/después
- IP del usuario

---

## 🎨 **FASE 4: UX y Visualización**

### **Tarea 4.1: Dashboard de Estado**
**Prioridad:** 🟢 Baja  
**Tiempo estimado:** 4 horas

**Componente:** `components/admin/seasons-tournaments-dashboard.tsx`

**Mostrar:**
- 🎯 Temporada activa actual
- 🏆 Torneos en curso
- ⏳ Torneos pendientes de finalización
- 📊 Estadísticas rápidas
- ⚠️ Alertas de acción requerida

### **Tarea 4.2: Historial de Temporadas**
**Prioridad:** 🟢 Baja  
**Tiempo estimado:** 3 horas

**Página:** `app/admin/seasons/history`

**Mostrar:**
- Lista de temporadas cerradas
- Resultados finales guardados
- Estadísticas de cada temporada
- Opción de "ver detalles"

---

## 📅 **Cronograma Sugerido**

### **Sprint 1 (Semana 1): Temporadas**
- Tarea 1.1: Modal de confirmación
- Tarea 1.2: API de cierre completo
- Tarea 1.3: Integración frontend

### **Sprint 2 (Semana 2): Torneos**
- Tarea 2.1: Estados automáticos
- Tarea 2.2: Modal de finalización
- Tarea 2.3: API de finalización

### **Sprint 3 (Semana 3): Seguridad**
- Tarea 3.1: Confirmaciones múltiples
- Tarea 3.2: Logging de auditoría

### **Sprint 4 (Semana 4): UX**
- Tarea 4.1: Dashboard de estado
- Tarea 4.2: Historial de temporadas

---

## 🎯 **Criterios de Éxito**

### **Temporadas:**
- ✅ No se pueden perder datos al cerrar temporada
- ✅ Confirmación clara antes de acciones irreversibles
- ✅ Reset completo de campos season_*
- ✅ Guardado completo en SeasonResult

### **Torneos:**
- ✅ Estado automático basado en fechas
- ✅ Finalización manual con confirmación
- ✅ Cálculo correcto de TournamentResult
- ✅ Preservación de puntos en Points

### **UX:**
- ✅ Flujos intuitivos y claros
- ✅ Confirmaciones apropiadas para cada acción
- ✅ Estados visuales claros
- ✅ Feedback inmediato de acciones

---

## 🔧 **Consideraciones Técnicas**

### **Base de Datos:**
- Usar transacciones para operaciones críticas
- Validar integridad antes de commits
- Considerar índices para consultas frecuentes

### **Performance:**
- Operaciones de cierre pueden ser lentas con muchos jugadores
- Considerar jobs en background para torneos grandes
- Cache de estados de torneo

### **Rollback:**
- Documentar proceso de rollback manual
- Considerar soft-deletes para SeasonResult
- Backup automático antes de operaciones críticas

Este plan prioriza la seguridad de datos y la experiencia del usuario, implementando confirmaciones apropiadas y flujos claros para evitar errores costosos.
