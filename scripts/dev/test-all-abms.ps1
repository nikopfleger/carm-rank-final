# Script simple para probar todos los ABMs
$baseUrl = "http://localhost:3000"
$resources = @("countries", "players", "locations", "tournaments", "rulesets", "uma", "seasons", "rate-configs", "dan-configs", "season-configs", "email-accounts", "users")

Write-Host "🧪 Probando ABMs (usando ID 1)..." -ForegroundColor Green
Write-Host ""

$totalPassed = 0
$totalTests = 0

foreach ($resource in $resources) {
    Write-Host "📋 $resource" -ForegroundColor Yellow
    $passed = 0
    $tests = 0
    
    # 1. LIST
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ LIST: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  ❌ LIST: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ LIST: FAIL" -ForegroundColor Red
    }
    
    # 2. GET BY ID
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource/1" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ GET: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  ❌ GET: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ GET: FAIL" -ForegroundColor Red
    }
    
    # 3. DELETE (soft delete)
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource/1" -Method DELETE -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ DELETE: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  ❌ DELETE: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ DELETE: FAIL" -ForegroundColor Red
    }
    
    # 4. RESTORE
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource/1/restore" -Method POST -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ RESTORE: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  ❌ RESTORE: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ RESTORE: FAIL" -ForegroundColor Red
    }
    
    # 5. SHOW DELETED
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource?includeDeleted=true" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ SHOW DELETED: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  ❌ SHOW DELETED: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ SHOW DELETED: FAIL" -ForegroundColor Red
    }
    
    Write-Host "  📊 $passed/$tests" -ForegroundColor $(if ($passed -eq $tests) { "Green" } else { "Yellow" })
    Write-Host ""
    
    $totalPassed += $passed
    $totalTests += $tests
}

Write-Host "🎯 RESULTADO FINAL: $totalPassed/$totalTests pruebas pasaron" -ForegroundColor $(if ($totalPassed -eq $totalTests) { "Green" } else { "Yellow" })

if ($totalPassed -eq $totalTests) {
    Write-Host "🎉 ¡Todos los ABMs funcionan!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Algunos ABMs tienen problemas." -ForegroundColor Yellow
}