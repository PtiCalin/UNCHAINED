# Contributing to UNCHAINED

Thanks for your interest in contributing! This guide helps you set up, code, and submit changes effectively.

## Prerequisites
- Windows 10/11
- Python 3.11+
- Node.js 18+
- Rust toolchain (for Tauri packaging)

## Setup
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-dev.ps1
```
Run backend:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1
```
Run frontend:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-frontend.ps1
```

## Branching & Commits
- Branch naming: `feat/<area>-<short-desc>`, `fix/<area>-<short-desc>`, `docs/<topic>`
- Commits: concise, imperative present (e.g., "Add track import endpoint")

## Code Style
- Backend: Pydantic models, FastAPI routers under `backend/app/api`, services under `backend/app/services`
- Frontend: React with hooks, functional components, Tailwind classes
- Avoid unrelated reformatting; keep PRs focused

## Testing
- Prefer unit tests close to files changed
- For backend, use `pytest` (add later in Phase 2-3)

## Pull Requests
- Describe the change and motivation
- Include testing notes and screenshots if UI
- Link related issues

## Issue Reporting
- Provide reproduction steps, logs, and environment details

## Security & Privacy
- No telemetry or tracking by default
- Handle local file paths securely; avoid leaking user data
