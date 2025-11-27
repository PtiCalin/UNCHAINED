# Setup Python venv and install backend deps
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

# Install Rust (needed for Tauri) - optional here
# winget install -e --id Rustlang.Rustup
# rustup default stable
# npm install -g @tauri-apps/cli@latest

Write-Host "Dev setup complete."