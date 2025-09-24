# Test completo de todos los ABMs
$baseUrl = "http://localhost:3000"

$abms = @(
    @{ name = "Paises"; resource = "countries" },
    @{ name = "Jugadores"; resource = "players" },
    @{ name = "Ubicaciones"; resource = "locations" },
    @{ name = "Torneos"; resource = "tournaments" },
    @{ name = "Reglas"; resource = "rulesets" },
    @{ name = "UMA"; resource = "uma" },
    @{ name = "Temporadas"; resource = "seasons" },
    @{ name = "Rate Configs"; resource = "rate-configs" },
    @{ name = "Dan Configs"; resource = "dan-configs" },
    @{ name = "Season Configs"; resource = "season-configs" },
    @{ name = "Email Accounts"; resource = "email-accounts" },
    @{ name = "Usuarios"; resource = "users" }
)

Write-Host "Probando todos los ABMs..." -ForegroundColor Green
Write-Host ""

$totalPassed = 0
$totalTests = 0
$results = @()

foreach ($abm in $abms) {
    Write-Host "Testing $($abm.name) ($($abm.resource))" -ForegroundColor Yellow
    
    $passed = 0
    $tests = 0
    
    # 1. LIST
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$($abm.resource)" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  LIST: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  LIST: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  LIST: FAIL" -ForegroundColor Red
    }
    
    # 2. GET BY ID
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$($abm.resource)/1" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  GET: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  GET: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  GET: FAIL" -ForegroundColor Red
    }
    
    # 3. DELETE
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$($abm.resource)/1" -Method DELETE -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  DELETE: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  DELETE: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  DELETE: FAIL" -ForegroundColor Red
    }
    
    # 4. RESTORE
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$($abm.resource)/1/restore" -Method POST -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  RESTORE: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  RESTORE: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  RESTORE: FAIL" -ForegroundColor Red
    }
    
    # 5. SHOW DELETED
    $tests++
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$($abm.resource)?includeDeleted=true" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  SHOW DELETED: OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  SHOW DELETED: FAIL" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  SHOW DELETED: FAIL" -ForegroundColor Red
    }
    
    $result = @{
        Name     = $abm.name
        Resource = $abm.resource
        Passed   = $passed
        Total    = $tests
        Status   = if ($passed -eq $tests) { "PASS" } else { "FAIL" }
    }
    
    $results += $result
    $totalPassed += $passed
    $totalTests += $tests
    
    Write-Host "  Resultado: $passed/$tests $($result.Status)" -ForegroundColor $(if ($passed -eq $tests) { "Green" } else { "Red" })
    Write-Host ""
}

# Resumen final
Write-Host "RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $results) {
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$($result.Name.PadRight(20)) $($result.Status) ($($result.Passed)/$($result.Total))" -ForegroundColor $color
}

Write-Host ""
Write-Host "TOTAL: $totalPassed/$totalTests pruebas pasaron" -ForegroundColor $(if ($totalPassed -eq $totalTests) { "Green" } else { "Yellow" })

if ($totalPassed -eq $totalTests) {
    Write-Host "TODOS LOS ABMs FUNCIONAN!" -ForegroundColor Green
}
else {
    $failed = $totalTests - $totalPassed
    Write-Host "$failed pruebas fallaron." -ForegroundColor Yellow
}