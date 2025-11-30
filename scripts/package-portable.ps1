Param(
  [string]$Output = "UNCHAINED-portable.zip",
  [switch]$IncludeVenv
)
Write-Host "== UNCHAINED Portable Package ==" -ForegroundColor Cyan

$root = Split-Path $PSScriptRoot -Parent
$staging = Join-Path $PSScriptRoot "_portable_staging"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Path $staging | Out-Null

Write-Host "Copying essential directories..." -ForegroundColor Yellow
# Core folders
$include = @("frontend/src-tauri/target/release","frontend/dist","backend/app","backend/requirements.txt","library","config","scripts")
foreach ($item in $include) {
  $src = Join-Path $root $item
  if (Test-Path $src) {
    $dest = Join-Path $staging $item
    New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
    Copy-Item $src -Destination $dest -Recurse -Force
  }
}

if ($IncludeVenv) {
  $venv = Join-Path $root "backend/.venv"
  if (Test-Path $venv) {
    Write-Host "Including Python virtual environment (large)." -ForegroundColor Yellow
    Copy-Item $venv -Destination (Join-Path $staging "backend/.venv") -Recurse -Force
  } else { Write-Warning "Venv requested but not found." }
}

# Launcher script
$launcher = @'
Write-Host "Launching UNCHAINED Portable" -ForegroundColor Cyan
if (-not (Test-Path "backend/.venv")) {
  Write-Host "Creating Python venv..." -ForegroundColor Yellow
  python -m venv backend/.venv
  backend/.venv/Scripts/python -m pip install --upgrade pip
  backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
}
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy","Bypass","-File","scripts/run-backend.ps1" -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "(Optional) Recomputing analytics..." -ForegroundColor Yellow
try { powershell -ExecutionPolicy Bypass -File scripts/recompute-analytics.ps1 } catch {}
Write-Host "Starting desktop app (if built) or dev frontend..." -ForegroundColor Yellow
if (Test-Path "frontend/src-tauri/target/release") {
  $exe = Get-ChildItem -Path frontend/src-tauri/target/release -Filter *.exe | Select-Object -First 1
  if ($exe) { Start-Process $exe.FullName } else { Write-Warning "Desktop executable not found. Falling back to dev server." }
}
if (-not (Get-Process -Name "tauri" -ErrorAction SilentlyContinue)) {
  Push-Location frontend
  npm install > $null
  npm run dev
  Pop-Location
}
'@
$launcherPath = Join-Path $staging "Launch-UNCHAINED.ps1"
$launcher | Out-File -Encoding UTF8 $launcherPath

Write-Host "Creating zip archive $Output" -ForegroundColor Yellow
if (Test-Path $Output) { Remove-Item $Output -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $Output

Remove-Item -Recurse -Force $staging
Write-Host "Portable package ready: $Output" -ForegroundColor Green
Write-Host "Distribute the zip; user runs Launch-UNCHAINED.ps1 after extracting." -ForegroundColor Cyan
