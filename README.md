# UNCHAINED



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

Frontend is React + Tailwind + Tauri (desktop). See UI Architecture below.

## Dev Scripts
- `scripts/setup-dev.ps1`: create venv, install backend dependencies
- `scripts/run-backend.ps1`: start FastAPI at `http://127.0.0.1:8000`
- `scripts/run-frontend.ps1`: start Vite at `http://localhost:5173`
- `scripts/run-download-worker.ps1`: process queued download jobs
 - `scripts/create-shortcuts.ps1`: create Windows Desktop & Start Menu shortcuts for the built Tauri app

## Environment Variables
Backend (`config/.env`):
- `API_HOST` (default `127.0.0.1`)
- `API_PORT` (default `8000`)

Frontend (`frontend/.env` optional):
- `VITE_API_BASE` (default `http://127.0.0.1:8000`)
 - `VITE_ENABLE_NOTIFICATIONS` (optional; defaults to true)

## Screenshots (planned)
- Library view
- Track table
- Analytics dashboard
- DJ studio
- Minimal Player
- Vinyl Timeline

## Community & Contributions
- Issues and PRs welcome
- PR template: see `.github/PULL_REQUEST_TEMPLATE.md`

## Source Imports (Legal)
- Spotify: supported for metadata and playlists via `/sources/spotify/playlists/import`. Audio downloads from Spotify are not supported.
- iTunes/Apple Music: import local iTunes library XML and copy referenced files via `/sources/itunes/library/import`.
- Bandcamp: queue authorized download links you provide via `/sources/bandcamp/collection/import` or `/sources/downloads/queue`. Downloader will fetch HTTP URLs you own access to.
 - MusicBrainz / Discogs: enrich metadata (search endpoints) before finalizing imports.
 - SoundCloud: resolve public track/playlist metadata only.
 - Local folder scan: bulk index/copy audio files for initial library population.

### Metadata Quality Aggregation
Use `/sources/metadata/quality` with artist/album/title to fetch multi-source candidates (MusicBrainz + Discogs), scored by field completeness. Optionally pass `path_audio` to persist candidates for later review.
Example:
```powershell
$Body = @{ artist = "Boards of Canada"; album = "Music Has the Right"; title = "Roygbiv"; path_audio = "library/audio/roygbiv.flac" } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Body -Uri http://127.0.0.1:8000/sources/metadata/quality
```

### Apply Candidate Metadata
Promote a chosen candidate into a track (fill missing fields & fetch cover):
```powershell
$Apply = @{ candidate_id = 12; track_id = 5 } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Apply -Uri http://127.0.0.1:8000/sources/metadata/apply
```
Returned track includes updated `title`, `artist`, `album`, `year`, `duration_ms`, and `path_cover` if downloaded.

### Provenance & Attribution
Each applied field stores its origin in `metadata_attribution` with source, candidate id, confidence score, and timestamp.
Retrieve attribution for a track:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/sources/metadata/attribution/5
```
Response lists `field_name`, `value`, `source`, and `confidence` for auditing and future reversion logic.

### Reversion & Diff
Revert latest applied field:
```powershell
$Revert = @{ track_id = 5; field_name = "album" } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Revert -Uri http://127.0.0.1:8000/sources/metadata/revert
```
Recalculate fuzzy confidence (using RapidFuzz) for current attribution set:
```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/sources/metadata/recalc-confidence/5
```
Fetch diff (current track + attribution + optional candidates):
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/sources/metadata/diff/5
```
Bulk apply multiple candidates:
```powershell
$Bulk = @{ items = @(@{ candidate_id = 12; track_id = 5}, @{ candidate_id = 33; track_id = 7}) } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Bulk -Uri http://127.0.0.1:8000/sources/metadata/apply/bulk
```

### Multiple Artwork Variants
Manage multiple covers per track (primary + alternates). Endpoints are under `/sources/tracks/{track_id}/artworks`.
List artworks:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/sources/tracks/5/artworks
```
Add artwork (download if `cover_url` provided):
```powershell
$Art = @{ cover_url = "https://example.com/alt.jpg"; source = "discogs" } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Art -Uri http://127.0.0.1:8000/sources/tracks/5/artworks
```
Set primary:
```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/sources/tracks/5/artworks/12/primary
```
Delete artwork:
```powershell
Invoke-RestMethod -Method Delete -Uri http://127.0.0.1:8000/sources/tracks/5/artworks/12
```

### Track Relations (Remix / Edit / Versions / Samples / Releases)
Link tracks with semantic relationships via `/sources/tracks/{track_id}/relations`.
Add relation:
```powershell
$Rel = @{ related_track_id = 9; relation_type = "remix" } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Rel -Uri http://127.0.0.1:8000/sources/tracks/5/relations
```
List relations:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/sources/tracks/5/relations
```
Delete relation:
```powershell
Invoke-RestMethod -Method Delete -Uri http://127.0.0.1:8000/sources/tracks/5/relations/14
```
Valid `relation_type` values: `remix`, `edit`, `alternate_version`, `sample_of`, `part_of_release`.

### Samples (Performance Pads)
Register time-ranged slices of a track (for DJ pad / sampler) via `/sources/tracks/{track_id}/samples`.
Add sample:
```powershell
$Sample = @{ start_ms = 30500; end_ms = 34000; pad_index = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType "application/json" -Body $Sample -Uri http://127.0.0.1:8000/sources/tracks/5/samples
```
List samples:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/sources/tracks/5/samples
```
Delete sample:
```powershell
Invoke-RestMethod -Method Delete -Uri http://127.0.0.1:8000/sources/tracks/5/samples/7
```
Future: waveform slicing & rendered audio stored in `path_audio`.

After queueing downloads, run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-download-worker.ps1
```

## Desktop Integration
- Notifications: enabled via Tauri allowlist. Frontend listens to backend SSE at `/sources/events/stream` and shows desktop notifications for `upload_complete` and `download_finished`.
- System Tray: configured in `frontend/tauri.conf.json` with quick actions (Open Library, Import Folder, Exit). Handlers will be wired via Tauri’s Rust side next.
- Shortcuts: `scripts/create-shortcuts.ps1` creates Desktop/Start Menu links to the built app.

SSE endpoints:
```http
GET  /sources/events/stream        # text/event-stream
POST /sources/events/emit          # { type, message, track_id? }
```

Frontend notifications bootstrap in `frontend/src/main.tsx` via `startNotifications()`.

## UI Architecture (Canonical)
Shared AppShell (TopBar, Sidebar, Main, BottomPlayer). DJ Studio overrides layout.

Modes:
- Spotify View (grid browsing)
- iTunes Pro (table + inspector)
- Vinyl Collector (timeline)
- Minimal Player (fullscreen aesthetic)
- Analytics (graphs)
- DJ Studio (fullscreen workstation)

Key files:
- `frontend/src/layouts/AppShell.tsx` — master shell
- `frontend/src/components/global/TopBar.tsx` — mode selector, global search, Import (MediaChoiceModal)
- `frontend/src/components/global/Sidebar.tsx` — navigation
- `frontend/src/components/global/BottomPlayer.tsx` — global player
- `frontend/src/views/*` — per-mode views (stubs ready)
- `frontend/src/store/useAppStore.ts` — Zustand global state
- `frontend/src/services/notifications.ts` — SSE notifications

Interaction rules:
- Click open; double-click play; Space play/pause; Ctrl/Cmd+F search; drag files to import
Accessibility & Responsiveness:
- Keyboard navigation, high-contrast mode; desktop-first with responsive collapses

See `UI_ARCHITECTURE.md` for the full specification.

## Project Vision
UNCHAINED is a local-first, privacy-respecting music library and DJ studio designed to work offline, then scale to the web without rewrites. Core subsystems: Media Storage, Analysis Engine, Audio Playback & DJ Engine, FastAPI backend, React/Tauri frontend.

## Tech Stack
- Backend: FastAPI, SQLite (later Postgres), Uvicorn, Pydantic, SQLAlchemy, Mutagen, Pillow
- Analysis: Librosa (start), later Essentia; NumPy/SciPy
- Frontend: React, Vite, Tailwind, Zustand, React Router, Tauri
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

