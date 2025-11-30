# UNCHAINED
---
**Quick Links:**
- [Testing Guide](./TESTING_GUIDE.md)
- [Testing Checklist](./TESTING_CHECKLIST.md)
- [Roadmap](./ROADMAP.md)
- [UI Architecture](./UI_ARCHITECTURE.md)
- [DJ Studio Features](./docs/DJ_STUDIO_FEATURES.md)
- [Known Issues](./docs/KNOWN_ISSUES.md)
- [Contributors](./docs/CONTRIBUTORS.md)
---

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688) ![React](https://img.shields.io/badge/frontend-React-61DAFB) ![Tauri](https://img.shields.io/badge/desktop-Tauri-FB8C00)

> Local‑first music library, metadata quality engine, multi‑artwork manager, provenance audit trail, and evolving DJ workstation — offline first, cloud ready.

## TL;DR
```
git clone https://github.com/PtiCalin/UNCHAINED.git
cd UNCHAINED
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-desktop.ps1   # Full env setup (Python venv, Node deps)
powershell -ExecutionPolicy Bypass -File scripts\first-run.ps1           # Launch backend + frontend dev
```
Desktop installer build:
```
powershell -ExecutionPolicy Bypass -File scripts\build-desktop.ps1
```

## Feature Matrix (Early Alpha)
| Area | Implemented | Planned |
|------|-------------|--------|
| Track Import (manual upload) | ✅ | Batch drag/drop |
| Local Folder Scan | ✅ | Incremental watch |
| iTunes XML Import | ✅ | Smart diff merges |
| Spotify Playlist Metadata | ✅ | OAuth flow refinement |
| Bandcamp Links Queue | ✅ | Auto cover extraction |
| Metadata Aggregation (MusicBrainz/Discogs) | ✅ | AcousticBrainz, niche DBs |
| Candidate Scoring & Apply | ✅ | ML weighted scoring |
| Field-Level Provenance & Revert | ✅ | Multi-step undo stack |
| Multi Artwork Variants | ✅ | Inline cropping & palette |
| Track Relations (remix/edit/version/sample/release) | ✅ | Graph visualization |
| Samples (pad slices) | ✅ | Waveform slice render |
| Global Search (local + backend) | ✅ | Full-text / fuzzy index |
| SSE Desktop Notifications | ✅ | Rich action buttons |
| System Tray Actions | ✅ | Dynamic progress + badges |
| Updater (pilot) | ✅ | Delta updates, signing finalized |
| DJ Studio (multi-deck, hotkeys, cues/loops/FX, DeckManager UI, analytics) | ✅ | Beat sync, mixer DSP |
| Analytics Dashboard | 🟨 | Embeddings, clustering |
| Audio Analysis (BPM/Key) | ⬜ | Phase 2 start |
| Cloud Sync | ⬜ | Postgres + object storage |


## Quick Start (Dev)

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

### Import a Track (Demo)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\import-demo.ps1 -FilePath "C:\\path\\to\\song.mp3"
```

## Architecture Overview
- **Backend**: FastAPI (`backend/app`), SQLite DB (`library/db/library.sqlite`), metadata extraction via Mutagen.
- **Library Storage**: `library/audio`, `library/covers`, `library/metadata`.
- **Config**: `config/settings.json`, `.env`.

Frontend is React + Tailwind + Tauri (desktop). See `ARCHITECTURE.md` and `UI_ARCHITECTURE.md`.

### High-Level Diagram (ASCII)
```
┌──────────────┐      SSE (events)      ┌──────────────────┐
│  FastAPI     │ ─────────────────────► │  React/Tauri UI  │
│  Routers     │ ◄───── REST / JSON ─── │  AppShell        │
│ /tracks      │                        │  Global Search   │
│ /sources/... │ ────► SQLite           │  Toasts/Tray     │
└─────┬────────┘        ▲              └─────────┬────────┘
	  │                 │                        │
  Metadata Services  Library DB            System Tray & Updater
	  │                 │                        │
  External APIs (MB, Discogs, Spotify, SC, Bandcamp)       
```

### Data Provenance Flow
1. Import / scan produces raw track rows.
2. `/sources/metadata/quality` aggregates candidate rows from external services.
3. User applies candidate ⇒ fields updated + attribution stored per field.
4. Reversion recalculates confidence; diff endpoint compares current vs candidates.

### Desktop Integration
System tray emits events → UI listens and triggers navigation or modals. Updater pilot checks remote manifest; toast host surfaces statuses.

## Dev Scripts
- `scripts/setup-dev.ps1`: create venv, install backend dependencies
 - `scripts/bootstrap-desktop.ps1`: end-to-end environment bootstrap (Python, deps, Node)
- `scripts/run-backend.ps1`: start FastAPI at `http://127.0.0.1:8000`
- `scripts/run-frontend.ps1`: start Vite at `http://localhost:5173`
- `scripts/run-download-worker.ps1`: process queued download jobs
 - `scripts/create-shortcuts.ps1`: create Windows Desktop & Start Menu shortcuts for the built Tauri app
 - `scripts/build-desktop.ps1`: build Tauri desktop installer
 - `scripts/first-run.ps1`: launch backend + frontend together
 - `scripts/diagnose-env.ps1`: print environment diagnostics (versions, key paths)

## Desktop Quick Start (Windows)
Prerequisites (auto-detected):
- Python 3.11+
- Node.js LTS (installed via winget if missing)
- Rust toolchain (for Tauri build)

One-line bootstrap + run:
```
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-desktop.ps1; powershell -ExecutionPolicy Bypass -File scripts\first-run.ps1
```
Build installer:
```
powershell -ExecutionPolicy Bypass -File scripts\build-desktop.ps1
```
Portable (no installer) package:
```
powershell -ExecutionPolicy Bypass -File scripts\package-portable.ps1 -Output UNCHAINED-portable.zip
```
Distribute `UNCHAINED-portable.zip`. User extracts anywhere and double-clicks `Launch-UNCHAINED.ps1` to:
1. Create Python venv if absent and install backend requirements
2. Start backend (FastAPI)
3. Optionally recompute analytics (embeddings, clusters, stats)
4. Launch built desktop executable if present, else start dev frontend

Recompute analytics manually (backend must be running):
```
powershell -ExecutionPolicy Bypass -File scripts\recompute-analytics.ps1 -Clusters 8
```

Self-extracting EXE (auto-unzip + launch):
Prerequisite: Install 7-Zip (ensures `7z.exe` in PATH) and have SFX module at `C:\Program Files\7-Zip\7z.sfx`.
```
powershell -ExecutionPolicy Bypass -File scripts\build-sfx-portable.ps1 -SfxOutput UNCHAINED-portable.exe
```
Share `UNCHAINED-portable.exe`. On double-click, it extracts to `%LOCALAPPDATA%\UNCHAINEDPortable` and runs `Launch-UNCHAINED.ps1` automatically.
Troubleshooting:
- Use `scripts\diagnose-env.ps1` to inspect environment.
- If `winget` is unavailable, manually install Node (https://nodejs.org) and Rust (https://rustup.rs).
- Delete `frontend\node_modules` and re-run bootstrap if dependency issues occur.
 - For portable mode ensure you extracted the zip (do not run inside the compressed folder in Explorer).
 - To build a fresh portable package after an update: run installer build (optional) then `package-portable.ps1`.

## Environment Variables
Backend (`config/.env`):
- `API_HOST` (default `127.0.0.1`)
- `API_PORT` (default `8000`)

Frontend (`frontend/.env` optional):
- `VITE_API_BASE` (default `http://127.0.0.1:8000`)
 - `VITE_ENABLE_NOTIFICATIONS` (optional; defaults to true)

## Screenshots (Placeholders)
See [SCREENSHOTS.md](./docs/SCREENSHOTS.md) for images and GIFs.

## Community & Contributions
Issues, PRs, and discussions welcome!
See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for guidelines.
PR template: see `.github/PULL_REQUEST_TEMPLATE.md`

## Source Imports & Legal Notes
## Known Issues
See [KNOWN_ISSUES.md](./docs/KNOWN_ISSUES.md) for current limitations and workarounds.
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

## Desktop Integration & Updater
- Notifications: enabled via Tauri allowlist. Frontend listens to backend SSE at `/sources/events/stream` and shows desktop notifications for `upload_complete` and `download_finished`.
- System Tray: implemented in `frontend/src-tauri/src/main.rs` with quick actions (Open Library, Import Folder, Exit). Events are emitted to the frontend as `tray://open-library` and `tray://import-folder`.
### Toast & Update Status
Real-time status for updater and scans is surfaced via a toast system:
- Component: `frontend/src/components/global/ToastHost.tsx`
- Store: `frontend/src/store/useToastStore.ts`
- Emitted events: `update://status` (from tray "Check for Updates"), folder scan completion

### Updater Manifest Example
See `update-manifest-example.json` for a template. Replace `SIGNATURE_BASE64_PLACEHOLDER` with the Ed25519 signature and host at an endpoint matching `tauri.conf.json` updater URL pattern.
- Shortcuts: `scripts/create-shortcuts.ps1` creates Desktop/Start Menu links to the built app.

SSE endpoints:
```http
GET  /sources/events/stream        # text/event-stream
POST /sources/events/emit          # { type, message, track_id? }
```

Frontend notifications bootstrap in `frontend/src/main.tsx` via `startNotifications()`.

Tray actions wiring in `frontend/src/main.tsx`:
- `tray://open-library`: navigates to `/pro` (Library)
- `tray://import-folder`: emits `window` event `tray-import-folder` (UI can open Import modal)

### Track Search API
Search tracks by title/artist/album with pagination:
```http
GET /tracks/search?q=term&limit=20&offset=0
```
Example (PowerShell):
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/tracks/search?q=boards&limit=10"
```

## UI Architecture (Canonical)
Shared AppShell (TopBar, Sidebar, Main, BottomPlayer). DJ Studio overrides layout.

Modes:
- Player (grid browsing)
- Library (table + inspector)
- Collection (timeline)
- Focus (fullscreen aesthetic)
- Dashboard (graphs)
- Studio (fullscreen workstation)

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

## Roadmap Snapshot
See `ROADMAP.md` for phases: Foundation → Analysis → UI Modes → Data Science → DJ Engine → Mixing Suite → Web Deployment.

## Contributing & Standards
See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md`.

Commit convention: Conventional Commits (e.g., `feat(metadata): add discogs token param`).
Branch naming: `feat/<area>`, `fix/<area>`, `docs/<topic>`, `chore/<scope>`.
Release process: update `CHANGELOG.md`, bump `version` in `tauri.conf.json` & `Cargo.toml`, draft notes from `.github/RELEASE_TEMPLATE.md`.

### Development Philosophy
Minimal surface changes, strong provenance, gradual enhancement over rewrites.

### Privacy
All processing is local; no analytics/telemetry. External lookups only when explicitly invoked by the user.

### Disclaimer
You are responsible for ensuring you have rights to any audio you import, scan or download.
We welcome issues and PRs. Please read `CONTRIBUTING.md` for environment setup, coding style, branch naming, and PR checklist.

## License
## Contributors
See [CONTRIBUTORS.md](./docs/CONTRIBUTORS.md) for a full list and how to add yourself.
MIT — see `LICENSE`.

## FAQ (Early)
Q: Does UNCHAINED download Spotify audio?  
A: No. Spotify integration is metadata + playlists only.

Q: Can I run on macOS/Linux?  
A: Core backend/frontend yes; Windows-first desktop packaging. Tauri cross-platform will be validated later.

Q: Will analysis slow large imports?  
A: Analysis batch jobs are deferred; initial ingestion remains fast while analysis runs asynchronously in future phases.

Q: How are updates verified?  
A: Manifest signature (Ed25519) — placeholder until signing keys are published.

---
For questions or ideas open a GitHub Issue or start a Discussion (coming soon).

