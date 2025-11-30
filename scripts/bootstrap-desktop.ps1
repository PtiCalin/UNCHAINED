Param(
    [switch]$SkipNode,
    [switch]$SkipRust
)
Write-Host "== UNCHAINED Desktop Bootstrap ==" -ForegroundColor Cyan

# Helper
function Test-Command { param($Name) (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null }

# 1. Ensure winget available
if (-not (Test-Command winget)) { Write-Warning "winget not found. Install Node/Rust manually." }

# 2. Node.js install (if missing)
if (-not $SkipNode) {
  if (-not (Test-Command node)) {
    Write-Host "Installing Node.js (LTS) via winget..." -ForegroundColor Yellow
    try { winget install -e --id OpenJS.NodeJS.LTS -h } catch { Write-Warning "Failed to install Node via winget. Install manually from https://nodejs.org" }
  } else { Write-Host "Node.js already present: $(node -v)" }
}

# 3. Rust (Tauri build prerequisite)
if (-not $SkipRust) {
  if (-not (Test-Command cargo)) {
    Write-Host "Rust not detected. Installing rustup..." -ForegroundColor Yellow
    try { Invoke-Expression ((Invoke-WebRequest -UseBasicParsing https://win.rustup.rs).Content) } catch { Write-Warning "Rust install failed. See https://rustup.rs" }
  } else { Write-Host "Rust toolchain present: $(rustc --version)" }
}

# 4. Python venv
$venvPath = Join-Path $PSScriptRoot "..\backend\.venv"
if (-not (Test-Path $venvPath)) {
  Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
  python -m venv $venvPath
}
$env:VIRTUAL_ENV = $venvPath
$pythonExe = Join-Path $venvPath "Scripts\python.exe"
Write-Host "Installing backend requirements..." -ForegroundColor Yellow
& $pythonExe -m pip install --upgrade pip > $null
& $pythonExe -m pip install -r (Join-Path $PSScriptRoot "..\backend\requirements.txt")

# 5. Frontend dependencies
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
if (Test-Path $frontendPath) {
  if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
  } else { Write-Host "Frontend dependencies already installed." }
}

# 6. .env templates
$backendEnv = Join-Path $PSScriptRoot "..\config\.env"
if (-not (Test-Path $backendEnv)) {
  "API_HOST=127.0.0.1`nAPI_PORT=8000" | Out-File -Encoding UTF8 $backendEnv
  Write-Host "Created backend .env" -ForegroundColor Green
}
$frontendEnv = Join-Path $frontendPath ".env"
if (-not (Test-Path $frontendEnv)) {
  "VITE_API_BASE=http://127.0.0.1:8000" | Out-File -Encoding UTF8 $frontendEnv
  Write-Host "Created frontend .env" -ForegroundColor Green
}

Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Run scripts\first-run.ps1 to start backend + frontend dev or scripts\build-desktop.ps1 for installer." -ForegroundColor Cyan
