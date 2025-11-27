param(
    [string]$AppName = "UNCHAINED",
    [string]$ExePath = "frontend\\dist\\UNCHAINED.exe"
)

$ErrorActionPreference = "Stop"

function New-Shortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Arguments = "",
        [string]$WorkingDirectory = $PWD.Path,
        [string]$IconLocation = $TargetPath
    )
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = (Resolve-Path -Path $TargetPath).Path
    $Shortcut.Arguments = $Arguments
    $Shortcut.WorkingDirectory = $WorkingDirectory
    $Shortcut.IconLocation = $IconLocation
    $Shortcut.Save()
}

# Ensure executable exists
if (-not (Test-Path $ExePath)) {
    Write-Host "Executable not found at $ExePath. Build the desktop app first." -ForegroundColor Yellow
    Write-Host "Try: npm run tauri build or use scripts\\run-frontend.ps1 to develop."
    exit 1
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$ShortcutName = "$AppName.lnk"

# Create Desktop shortcut
$DesktopShortcut = Join-Path $Desktop $ShortcutName
New-Shortcut -ShortcutPath $DesktopShortcut -TargetPath $ExePath -WorkingDirectory (Split-Path -Path $ExePath -Parent)
Write-Host "Created desktop shortcut: $DesktopShortcut" -ForegroundColor Green

# Create Start Menu shortcut
$StartShortcut = Join-Path $StartMenu $ShortcutName
New-Shortcut -ShortcutPath $StartShortcut -TargetPath $ExePath -WorkingDirectory (Split-Path -Path $ExePath -Parent)
Write-Host "Created Start Menu shortcut: $StartShortcut" -ForegroundColor Green
