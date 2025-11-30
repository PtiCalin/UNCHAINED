Param(
	[switch]$PrecomputeAnalytics,
	[int]$ClusterCount = 8
)
Write-Host "== UNCHAINED Desktop Build ==" -ForegroundColor Cyan

function Test-Command { param($Name) (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null }

if (-not (Test-Command cargo)) { Write-Warning "Rust toolchain missing (cargo). Install via rustup before building."; exit 1 }
if (-not (Test-Command node)) { Write-Warning "Node.js missing. Install from https://nodejs.org."; exit 1 }

$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Push-Location $frontendPath
Write-Host "Installing/updating frontend deps..." -ForegroundColor Yellow
npm install
Write-Host "Running Tauri build..." -ForegroundColor Yellow
npx tauri build
Pop-Location

Write-Host "Creating Windows shortcuts..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "create-shortcuts.ps1")

if ($PrecomputeAnalytics) {
	Write-Host "Precomputing embeddings, clusters, and stats..." -ForegroundColor Cyan
	$backendProc = Start-Process powershell -ArgumentList "-ExecutionPolicy","Bypass","-File", (Join-Path $PSScriptRoot "run-backend.ps1") -PassThru
	Start-Sleep -Seconds 5
	try {
		Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/embeddings/compute -Body (@{ force_recompute = $true } | ConvertTo-Json) -ContentType 'application/json' | Out-Null
		Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/clusters/compute -Body (@{ algorithm = 'kmeans'; n_clusters = $ClusterCount } | ConvertTo-Json) -ContentType 'application/json' | Out-Null
		Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/stats/compute | Out-Null
		Write-Host "Analytics precomputation complete." -ForegroundColor Green
	} catch {
		Write-Warning "Analytics precomputation failed: $($_.Exception.Message)"
	} finally {
		if ($backendProc -and !$backendProc.HasExited) { $backendProc | Stop-Process }
	}
}

Write-Host "Desktop build complete. Installer available in frontend\src-tauri\target\release" -ForegroundColor Green
