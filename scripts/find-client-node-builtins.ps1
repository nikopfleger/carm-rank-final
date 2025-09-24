Param(
    [string]$Root = "."
)

$ErrorActionPreference = 'Stop'

# 1) Archivos cliente (que declaran "use client")
$allFiles = Get-ChildItem -Path $Root -Recurse -File -Include *.ts, *.tsx |
Where-Object { $_.FullName -notmatch "node_modules|\\.next" }

$clientFiles = @()
foreach ($file in $allFiles) {
    $firstLines = Get-Content -LiteralPath $file.FullName -TotalCount 5
    if ($firstLines -match '^[\s]*["\'']use client["\'']') {
        $clientFiles += $file.FullName
    }
}
$clientFiles = $clientFiles | Sort-Object -Unique

Write-Host "--- CLIENT FILES (count=$($clientFiles.Count)) ---"
$clientFiles | ForEach-Object { Write-Host $_ }

# 2) Imports bare de esos clientes (no relativos)
$clientPkgs = @()
foreach ($f in $clientFiles) {
    $lines = Get-Content -LiteralPath $f
    foreach ($line in $lines) {
        $m = [regex]::Match($line, 'from\s+"([^"]+)"')
        if (-not $m.Success) { $m = [regex]::Match($line, 'from\s+''([^'']+)''') }
        if ($m.Success) {
            $spec = $m.Groups[1].Value
            if ($spec -and ($spec -notmatch '^(\.|/)')) {
                $clientPkgs += $spec
            }
        }
        # soportar import x from pkg; import {x} from pkg; import 'pkg'
        if (-not $m.Success) {
            $m2 = [regex]::Match($line, '^\s*import\s+[^\{].*?from\s+(["\'']([^"\'']+)["\'']);?')
            if (-not $m2.Success) { $m2 = [regex]::Match($line, '^\s*import\s+\{.*?\}\s+from\s+(["\'']([^"\'']+)["\''])') }
            if (-not $m2.Success) { $m2 = [regex]::Match($line, '^\s*import\s+(["\'']([^"\'']+)["\''])') }
            if ($m2.Success) {
                $raw = $m2.Groups[2].Value
                if ($raw -and ($raw -notmatch '^(\.|/)')) { $clientPkgs += $raw }
            }
        }
    }
}
$clientPkgs = $clientPkgs | Sort-Object -Unique

Write-Host "`n--- CLIENT PACKAGES (count=$($clientPkgs.Count)) ---"
$clientPkgs | ForEach-Object { Write-Host $_ }

# 3) Buscar usos de node:* o built-ins problemáticos en node_modules de esos paquetes
Write-Host "`n--- SCAN NODE BUILTINS ---"
foreach ($p in $clientPkgs) {
    $dir = Join-Path (Join-Path $Root 'node_modules') $p
    if (Test-Path $dir) {
        $files = Get-ChildItem -Recurse -File -Path $dir -ErrorAction SilentlyContinue
        if ($files.Count -gt 0) {
            $hits = $files | Select-String -Pattern @(
                'from\s+["\'']node:',
                'require\(\s*["\'']node:',
                '\bchild_process\b',
                '\bfs\b',
                '\bfs/promises\b',
                '\bpath\b',
                '\bos\b',
                '\burl\b',
                '\bmodule\b'
            ) -ErrorAction SilentlyContinue
            if ($hits) {
                Write-Host "`n=== $p ==="
                $hits | Select-Object -First 8 | ForEach-Object { Write-Host ("$($_.Path):$($_.LineNumber): $($_.Line)") }
            }
        }
    }
}

Write-Host "`nDone."


