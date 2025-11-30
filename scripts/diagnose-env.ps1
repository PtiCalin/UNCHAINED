Write-Host "== UNCHAINED Environment Diagnostics ==" -ForegroundColor Cyan

function Safe-Version($cmd, $args="--version") {
  try { & $cmd $args } catch { "(not found)" }
}

$report = [ordered]@{
  Node = Safe-Version node
  NPM = Safe-Version npm
  Python = Safe-Version python
  Pip = Safe-Version pip
  Rustc = Safe-Version rustc
  Cargo = Safe-Version cargo
}

$report.GetEnumerator() | ForEach-Object { Write-Host ("{0,-10} {1}" -f $_.Key, $_.Value) }

Write-Host "Checking key paths..." -ForegroundColor Yellow
$paths = @(
  "backend\\requirements.txt",
  "frontend\\package.json",
  "frontend\\src-tauri\\tauri.conf.json"
)
foreach ($p in $paths) { Write-Host ("{0,-40} {1}" -f $p, (Test-Path (Join-Path $PSScriptRoot "..\" $p))) }

Write-Host "Diagnostics complete." -ForegroundColor Green
