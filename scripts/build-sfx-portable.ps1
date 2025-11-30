Param(
  [string]$SfxOutput = "UNCHAINED-portable.exe",
  [string]$SfxModulePath = "C:\\Program Files\\7-Zip\\7z.sfx",
  [switch]$IncludeVenv
)

Write-Host "== UNCHAINED Self-Extracting (SFX) Portable Build ==" -ForegroundColor Cyan

function Test-Command { param($Name) (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null }

# Check 7-Zip availability
if (-not (Test-Command 7z)) {
  Write-Warning "7z (7-Zip) not found in PATH. Install 7-Zip and ensure '7z.exe' is accessible."
  if (-not (Test-Path $SfxModulePath)) { Write-Error "SFX module not found at $SfxModulePath"; exit 1 }
}
if (-not (Test-Path $SfxModulePath)) { Write-Error "SFX module not found at $SfxModulePath"; exit 1 }

$root = Split-Path $PSScriptRoot -Parent
$staging = Join-Path $PSScriptRoot "_sfx_staging"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Path $staging | Out-Null

Write-Host "Copying portable payload..." -ForegroundColor Yellow
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
  }
}

# Ensure Launch script exists (reuse same as zip portable)
$launcherPath = Join-Path $staging "Launch-UNCHAINED.ps1"
if (-not (Test-Path $launcherPath)) {
  Write-Error "Launch-UNCHAINED.ps1 not found in staging; run package-portable.ps1 first or ensure scripts are copied."
  # Try generating it similarly to package-portable
  Write-Host "Generating Launch-UNCHAINED.ps1..." -ForegroundColor Yellow
  $content = @'
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
try { powershell -ExecutionPolicy Bypass -File scripts/recompute-analytics.ps1 } catch {}
if (Test-Path "frontend/src-tauri/target/release") {
  $exe = Get-ChildItem -Path frontend/src-tauri/target/release -Filter *.exe | Select-Object -First 1
  if ($exe) { Start-Process $exe.FullName }
} else {
  Push-Location frontend; npm install > $null; npm run dev; Pop-Location
}
'@
  $content | Out-File -Encoding UTF8 $launcherPath
}

# Create SFX config
$sfxCfg = @'
;!@Install@!UTF-8!
Title="UNCHAINED Portable"
ExtractTitle="UNCHAINED Portable"
InstallPath="%LOCALAPPDATA%\\UNCHAINEDPortable"
GUIMode="2"
RunProgram="powershell.exe -ExecutionPolicy Bypass -File Launch-UNCHAINED.ps1"
;!@InstallEnd@!
'@
$cfgPath = Join-Path $PSScriptRoot "sfx-config.txt"
$sfxCfg | Out-File -Encoding UTF8 $cfgPath

# Create .7z archive of staging
$archivePath = Join-Path $PSScriptRoot "_portable_payload.7z"
if (Test-Path $archivePath) { Remove-Item $archivePath -Force }
& 7z a -t7z -m0=lzma2 -mx=9 -mmt=on $archivePath "${staging}\*" | Out-Null

# Concatenate SFX module + config + archive => EXE
if (Test-Path $SfxOutput) { Remove-Item $SfxOutput -Force }
$parts = @($SfxModulePath, $cfgPath, $archivePath)
[System.IO.File]::WriteAllBytes($SfxOutput, (Get-Content -Path $parts -AsByteStream -Raw))

# Cleanup
Remove-Item -Recurse -Force $staging
Remove-Item $archivePath -Force
Remove-Item $cfgPath -Force

Write-Host "SFX portable EXE created: $SfxOutput" -ForegroundColor Green
Write-Host "Double-click to extract to %LOCALAPPDATA%\\UNCHAINEDPortable and auto-launch." -ForegroundColor Cyan
