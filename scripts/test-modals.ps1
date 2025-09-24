# Script para probar que todos los ABMs tienen modales de confirmación
Write-Host "🧪 Probando modales de confirmación en todos los ABMs..." -ForegroundColor Cyan

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

$results = @()

foreach ($resource in $resources) {
    Write-Host "`n📋 Probando $resource..." -ForegroundColor Yellow
    
    try {
        # Probar GET
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/abm/$resource" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ GET funciona" -ForegroundColor Green
        }
        
        # Probar GET con includeDeleted
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/abm/$resource?includeDeleted=true" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ GET con eliminados funciona" -ForegroundColor Green
        }
        
        $results += [PSCustomObject]@{
            Resource = $resource
            Status = "✅ Funciona"
            GET = "✅"
            GET_DELETED = "✅"
        }
        
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Resource = $resource
            Status = "❌ Error"
            GET = "❌"
            GET_DELETED = "❌"
        }
    }
}

Write-Host "`n📊 RESUMEN DE RESULTADOS:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

Write-Host "`n🎯 NOTA: Los modales de confirmación se prueban en la interfaz web:" -ForegroundColor Yellow
Write-Host "   - DELETE: Modal rojo de confirmación" -ForegroundColor Red
Write-Host "   - RESTORE: Modal azul de confirmación" -ForegroundColor Blue
Write-Host "`n🌐 Abre http://localhost:3000/admin/abm/[recurso] para probar los modales" -ForegroundColor Green
