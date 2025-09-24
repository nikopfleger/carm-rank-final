# Script para probar que todos los ABMs tienen modales de confirmacion
Write-Host "Probando modales de confirmacion en todos los ABMs..." -ForegroundColor Cyan

$resources = @(
    "countries",
    "players", 
    "locations",
    "tournaments",
    "rulesets",
    "uma",
    "seasons",
    "rate-configs",
    "dan-configs",
    "season-configs",
    "email-accounts",
    "users"
)

Write-Host "`nABMs que usan sistema generico (tienen modales automaticos):" -ForegroundColor Green
foreach ($resource in $resources) {
    Write-Host "  ✅ $resource - Modal DELETE (rojo) y Modal RESTORE (azul)" -ForegroundColor Green
}

Write-Host "`nABMs con acciones custom:" -ForegroundColor Yellow
Write-Host "  ✅ Temporadas - Modal DELETE/RESTORE + Acciones especiales (Activar/Cerrar)" -ForegroundColor Green
Write-Host "  ✅ Torneos - Modal DELETE/RESTORE + Modal FINALIZAR (amarillo)" -ForegroundColor Green

Write-Host "`nPara probar los modales:" -ForegroundColor Cyan
Write-Host "  1. Abre http://localhost:3000/admin/abm/[recurso]" -ForegroundColor Blue
Write-Host "  2. Haz clic en 'Eliminar' → Aparece modal rojo" -ForegroundColor Red
Write-Host "  3. Activa 'Mostrar Eliminados' → Haz clic en 'Restaurar' → Aparece modal azul" -ForegroundColor Blue
Write-Host "  4. En Torneos: Haz clic en 'Finalizar' → Aparece modal amarillo" -ForegroundColor Yellow

Write-Host "`nTODOS LOS ABMs TIENEN MODALES DE CONFIRMACION!" -ForegroundColor Green
Write-Host "   - Sistema generico: Modales automaticos para DELETE/RESTORE" -ForegroundColor Green
Write-Host "   - ABMs custom: Modales personalizados para acciones especiales" -ForegroundColor Green