Param(
  [int]$Clusters = 8
)
Write-Host "== UNCHAINED Recompute Analytics ==" -ForegroundColor Cyan
try {
  Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/embeddings/compute -Body (@{ force_recompute = $true } | ConvertTo-Json) -ContentType 'application/json' | Out-Null
  Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/clusters/compute -Body (@{ algorithm = 'kmeans'; n_clusters = $Clusters } | ConvertTo-Json) -ContentType 'application/json' | Out-Null
  Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/analytics/stats/compute | Out-Null
  Write-Host "Analytics recompute complete." -ForegroundColor Green
} catch {
  Write-Warning "Failed to recompute analytics: $($_.Exception.Message)"
  Write-Host "Ensure backend is running via scripts/run-backend.ps1" -ForegroundColor Yellow
}