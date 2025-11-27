# Demo: import a sample audio file via API
param(
  [Parameter(Mandatory=$true)][string]$FilePath
)

$uri = "http://127.0.0.1:8000/tracks/import"

$fields = @{
  file = Get-Item -Path $FilePath
}

Invoke-WebRequest -Uri $uri -Method Post -InFile $FilePath -ContentType "audio/mpeg" | Select-Object -ExpandProperty Content | Write-Output