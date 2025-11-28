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
- Branch naming: `feat/<area>`, `fix/<area>`, `docs/<topic>`, `chore/<scope>`, `refactor/<scope>`
- Conventional Commits strongly encouraged:
	- `feat(metadata): add discogs token param`
	- `fix(scan): handle unicode paths`
	- `docs(readme): add feature matrix`
	- `chore(deps): bump fastapi`
	- `refactor(ui): extract toast host`
- Keep commits atomic; prefer smaller PRs.

## Code Style
- Backend: Pydantic models, FastAPI routers under `backend/app/api`, services under `backend/app/services`
- Frontend: React with hooks, functional components, Tailwind classes
- Avoid unrelated reformatting; keep PRs focused

## Testing
- Unit tests (Python `pytest`) will appear Phase 2; for now manual verification.
- Avoid blocking large feature PRs waiting on future test harness.

## Pull Requests
- Describe motivation & scope; reference issue number.
- Include screenshots (UI) or sample API calls.
- Update `CHANGELOG.md` (Unreleased section) when user-facing changes occur.
- Use Draft PRs for early feedback.

## Issue Reporting
- Provide reproduction steps, logs, and environment details

## Security & Privacy
- No telemetry/tracking.
- Do not commit secrets.
- Validate any new external service integrations for rate limits & auth.

## Release Process
1. Update CHANGELOG (move Unreleased entries under version).
2. Bump version in `tauri.conf.json` and `src-tauri/Cargo.toml`.
3. Build installer: `npx tauri build`.
4. Generate & sign update manifest; publish to endpoint.
5. Create GitHub Release using `.github/RELEASE_TEMPLATE.md`.

## DCO / Sign-Off (Optional Future)
If DCO enforced later: append `Signed-off-by: Name <email>` to commit messages.
