# Script para agregar export const dynamic = 'force-dynamic' a endpoints que usan request.url

$apiFiles = @(
    "app/api/abm/uma/route.ts",
    "app/api/abm/locations/route.ts", 
    "app/api/abm/countries/route.ts",
    "app/api/abm/[resource]/route.ts",
    "app/api/players/search/route.ts",
    "app/api/players/count-games/route.ts",
    "app/api/players/check-nickname/route.ts",
    "app/api/players/check-legajo/route.ts",
    "app/api/games/history/route.ts",
    "app/api/config/dan-configs/route.ts",
    "app/api/abm/tournament-results/route.ts",
    "app/api/abm/seasons/route.ts",
    "app/api/abm/season-results/route.ts",
    "app/api/abm/online-users/route.ts",
    "app/api/config/rate/route.ts",
    "app/api/config/season/route.ts",
    "app/api/config/dan/route.ts",
    "app/api/seasons/[id]/route.ts",
    "app/api/seasons/route.ts",
    "app/api/common/route.ts"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -notmatch "export const dynamic") {
            # Buscar la línea después de los imports
            $lines = $content -split "`n"
            $newContent = @()
            $foundImports = $false
            
            foreach ($line in $lines) {
                $newContent += $line
                
                # Si encontramos el último import y no hemos agregado dynamic aún
                if ($line -match "^import.*from.*;" -and -not $foundImports) {
                    $newContent += ""
                    $newContent += "export const dynamic = 'force-dynamic';"
                    $foundImports = $true
                }
            }
            
            $newContent = $newContent -join "`n"
            Set-Content $file -Value $newContent -NoNewline
            Write-Host "✅ Fixed: $file"
        }
        else {
            Write-Host "⏭️  Already has dynamic: $file"
        }
    }
    else {
        Write-Host "❌ File not found: $file"
    }
}

Write-Host "🎉 Dynamic routes fix completed!"
