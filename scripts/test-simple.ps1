# Test simple de ABMs
$baseUrl = "http://localhost:3000"
$resources = @("countries", "players", "seasons", "rate-configs")

Write-Host "Testing ABMs..." -ForegroundColor Green

foreach ($resource in $resources) {
    Write-Host "Testing $resource" -ForegroundColor Yellow
    
    # Test LIST
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource" -Method GET
        Write-Host "  LIST: OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  LIST: FAIL" -ForegroundColor Red
    }
    
    # Test DELETE
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource/1" -Method DELETE
        Write-Host "  DELETE: OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  DELETE: FAIL" -ForegroundColor Red
    }
    
    # Test RESTORE
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/abm/$resource/1/restore" -Method POST
        Write-Host "  RESTORE: OK" -ForegroundColor Green
    }
    catch {
        Write-Host "  RESTORE: FAIL" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Green
