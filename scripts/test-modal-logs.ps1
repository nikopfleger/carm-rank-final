# Script para probar logs de modales
Write-Host "COMO VERIFICAR SI SE ABRIO UN MODAL:" -ForegroundColor Cyan

Write-Host "`n1. LOGS DEL NAVEGADOR (Console):" -ForegroundColor Yellow
Write-Host "   a) Abre http://localhost:3000/admin/abm/countries" -ForegroundColor Blue
Write-Host "   b) Presiona F12 para abrir DevTools" -ForegroundColor Blue
Write-Host "   c) Ve a la pestaña Console" -ForegroundColor Blue
Write-Host "   d) Haz clic en Eliminar → Veras: Modal DELETE abierto para: {...}" -ForegroundColor Red
Write-Host "   e) Haz clic en Confirmar → Veras: Modal DELETE confirmado para: {...}" -ForegroundColor Red
Write-Host "   f) Haz clic en Cancelar → Veras: Modal DELETE cancelado" -ForegroundColor Red

Write-Host "`n2. LOGS DE RESTORE:" -ForegroundColor Yellow
Write-Host "   a) Activa Mostrar Eliminados" -ForegroundColor Blue
Write-Host "   b) Haz clic en Restaurar → Veras: Modal RESTORE abierto para: {...}" -ForegroundColor Blue
Write-Host "   c) Haz clic en Confirmar → Veras: Modal RESTORE confirmado para: {...}" -ForegroundColor Blue

Write-Host "`n3. LOGS DE TORNEOS (Modal Custom):" -ForegroundColor Yellow
Write-Host "   a) Ve a http://localhost:3000/admin/abm/tournaments" -ForegroundColor Blue
Write-Host "   b) Haz clic en Finalizar → Veras: Modal FINALIZAR abierto para: {...}" -ForegroundColor Yellow
Write-Host "   c) Haz clic en Finalizar Torneo → Veras: Modal FINALIZAR confirmado para: {...}" -ForegroundColor Yellow

Write-Host "`n4. LOGS DEL SERVIDOR:" -ForegroundColor Yellow
Write-Host "   a) Mira la terminal donde corre npm run dev" -ForegroundColor Blue
Write-Host "   b) Veras logs como:" -ForegroundColor Green
Write-Host "      - Deleting countries with id: 1" -ForegroundColor Green
Write-Host "      - Restoring countries with id: 1" -ForegroundColor Green
Write-Host "      - Successfully deleted countries 1" -ForegroundColor Green

Write-Host "`nTIPOS DE LOGS:" -ForegroundColor Cyan
Write-Host "   Modal DELETE (rojo) - Para eliminar" -ForegroundColor Red
Write-Host "   Modal RESTORE (azul) - Para restaurar" -ForegroundColor Blue
Write-Host "   Modal FINALIZAR (amarillo) - Para acciones criticas" -ForegroundColor Yellow
Write-Host "   Servidor DELETE - Confirmacion en backend" -ForegroundColor Green
Write-Host "   Servidor RESTORE - Confirmacion en backend" -ForegroundColor Green

Write-Host "`nAHORA PUEDES VER EXACTAMENTE CUANDO SE ABREN LOS MODALES!" -ForegroundColor Green