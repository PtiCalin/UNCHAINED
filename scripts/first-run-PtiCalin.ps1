Write-Host "== UNCHAINED First Run ==" -ForegroundColor Cyan

Write-Host "== UNCHAINED First Run ==" -ForegroundColor Cyan

# Create virtual environment if not exists
if (!(Test-Path ".venv")) {
	python -m venv .venv
}

# Activate venv and install requirements
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& ".venv\Scripts\Activate.ps1"
pip install -r backend\requirements.txt

# Start backend (run in new PowerShell window for desktop)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd $PWD; & python backend/app/main.py'

# Start frontend (run in new PowerShell window for desktop)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd $PWD; npm run dev --prefix frontend'

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
