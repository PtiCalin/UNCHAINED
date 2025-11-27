# UNCHAINED

Post-modern audio management software.

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue)

## Quick Start (Phase 1)

### Backend
1. Setup Python env and deps:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-dev.ps1
```
2. Run API:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1
```
3. Health check: open `http://127.0.0.1:8000/health`

### Import a Track (demo)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\import-demo.ps1 -FilePath "C:\\path\\to\\song.mp3"
```

## Architecture Overview
- **Backend**: FastAPI (`backend/app`), SQLite DB (`library/db/library.sqlite`), metadata extraction via Mutagen.
- **Library Storage**: `library/audio`, `library/covers`, `library/metadata`.
- **Config**: `config/settings.json`, `.env`.

Frontend (React + Tailwind + Tauri) scaffolding will be added next.

## Dev Scripts
- `scripts/setup-dev.ps1`: create venv, install backend dependencies
- `scripts/run-backend.ps1`: start FastAPI at `http://127.0.0.1:8000`
- `scripts/run-frontend.ps1`: start Vite at `http://localhost:5173`
- `scripts/run-download-worker.ps1`: process queued download jobs

## Environment Variables
Backend (`config/.env`):
- `API_HOST` (default `127.0.0.1`)
- `API_PORT` (default `8000`)

Frontend (`frontend/.env` optional):
- `VITE_API_BASE` (default `http://127.0.0.1:8000`)

## Screenshots (planned)
- Library view
- Track table
- Analytics dashboard
- DJ studio

## Community & Contributions
- Issues and PRs welcome
- PR template: see `.github/PULL_REQUEST_TEMPLATE.md`

## Source Imports (Legal)
- Spotify: supported for metadata and playlists via `/sources/spotify/playlists/import`. Audio downloads from Spotify are not supported.
- iTunes/Apple Music: import local iTunes library XML and copy referenced files via `/sources/itunes/library/import`.
- Bandcamp: queue authorized download links you provide via `/sources/bandcamp/collection/import` or `/sources/downloads/queue`. Downloader will fetch HTTP URLs you own access to.

After queueing downloads, run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-download-worker.ps1
```

## Project Vision
UNCHAINED is a local-first, privacy-respecting music library and DJ studio designed to work offline, then scale to the web without rewrites. Core subsystems: Media Storage, Analysis Engine, Audio Playback & DJ Engine, FastAPI backend, React/Tauri frontend.

## Tech Stack
- Backend: FastAPI, SQLite (later Postgres), Uvicorn, Pydantic, SQLAlchemy, Mutagen, Pillow
- Analysis: Librosa (start), later Essentia; NumPy/SciPy
- Frontend: React, Vite, Tailwind, Zustand, React Router
- Desktop: Tauri (Windows-first)

## Repository Layout
```
backend/        # FastAPI app, services, models, utils
library/        # Audio, covers, metadata, db
frontend/       # React + Tailwind + Tauri
config/         # .env, settings.json
scripts/        # Dev helpers and runners
```

## Roadmap
See `ROADMAP.md` for phases: Foundation → Analysis → UI Modes → Data Science → DJ Engine → Mixing Suite → Web Deployment.

## Contributing
We welcome issues and PRs. Please read `CONTRIBUTING.md` for environment setup, coding style, branch naming, and PR checklist.

## License
This project is licensed under the MIT License. See `LICENSE`.

