Write-Host "== UNCHAINED First Run ==" -ForegroundColor Cyan

# Start backend
Write-Host "Starting backend (FastAPI)..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "run-backend.ps1") &

Start-Sleep -Seconds 2

# Start frontend dev (Vite)
Write-Host "Starting frontend (Vite)..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Push-Location $frontendPath
npm run dev
Pop-Location
