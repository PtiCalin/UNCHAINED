# UNCHAINED

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688) ![React](https://img.shields.io/badge/frontend-React-61DAFB) ![Tauri](https://img.shields.io/badge/desktop-Tauri-FB8C00)

> A local-first creative AI operating system that unifies generation, editing, provenance, and media memory across music, images, video, documents, code, and data. The ultimate library of libraries and creative coordination hub, with built-in collaboration, automation, and full ownership. Private, secure, no cloud lock-in. Automate, collaborate, and build AI workflows on your terms with cross-media intelligence, and true data ownership. No cloud required.

## Product Positioning

UNCHAINED is the **platform**. The current music-focused application is now framed as **UNCHAINED Music**, the first major module in the wider ecosystem.

### Platform-level non-negotiables
- **Local-first execution**: assets, metadata, and model orchestration run on the user's machine.
- **Unified media library**: image/audio/video/data assets live in one indexed and queryable system.
- **Job-based workflows**: generation/edit/remix/conversion tasks run as background jobs with logs and retry semantics.
- **Plugin boundaries**: capabilities are shipped as plugins, not hard-coded one-offs.
- **Reproducibility**: every output stores model, parameters, seed, tool version, and source lineage.

## Product Hierarchy

- **UNCHAINED (Platform)**
  - Core runtime, media library, job engine, model orchestration, and plugin API.
- **UNCHAINED Audio (Current module)**
  - Metadata-rich music library, provenance tooling, DJ studio, and audio-centric workflows.
- **Future sibling modules**
  - UNCHAINED Image
  - UNCHAINED Voice -- sub module of audio
  - UNCHAINED DJ -- sub module of audio
  - UNCHAINED Video
  - UNCHAINED Data
  - UNCHAINED Docs
  - UNCHAINED Code
  - UNCHAINED 3D
  - UNCHAINE

## Architecture Blueprint

### Core platform modules
1. **Library Core**
   - SQLite metadata DB + deterministic filesystem layout.
   - Indexing, tags, relationships, and provenance tracking.
2. **Job System**
   - Queue-backed background execution.
   - States: queued → running → succeeded/failed/cancelled.
   - Streaming logs to UI.
3. **Model Manager**
   - Local model registry and health checks.
   - Ollama as orchestration/reasoning layer.
4. **Plugin Runtime**
   - Plugin manifests define capabilities, required models, input/output contracts, and UI presence.

### Reference repository split (target)

```text
UNCHAINED/
├─ unchained-core
│  ├─ library
│  ├─ jobs
│  ├─ models
│  ├─ plugins
│  ├─ collab
│  └─ desktop-shell
├─ unchained-audio
│  ├─ music
│  ├─ voice
│  ├─ dj
│  ├─ analysis
│  ├─ effects
│  ├─ stems
│  ├─ samples
│  └─ learn
├─ unchained-image
│  ├─ editing
│  ├─ generation
│  ├─ tagging
│  ├─ filters
│  └─ learn
├─ unchained-video
│  ├─ editing
│  ├─ generation
│  ├─ effects
│  ├─ subtitles
│  ├─ transcoding
│  └─ learn
├─ unchained-docs
│  ├─ knowledge-graph
│  ├─ semantic-search
│  ├─ summarization
│  ├─ compare
│  ├─ annotation
│  └─ learn
├─ unchained-code
│  ├─ learn
│  ├─ snippets
│  ├─ ai-codegen
│  ├─ linting
│  ├─ testing
│  └─ dependency-graph
├─ unchained-3d
│  ├─ models
│  ├─ scenes
│  ├─ rendering
│  ├─ animation
│  └─ learn
├─ unchained-games
│  ├─ library
│  ├─ assets
│  ├─ mods
│  ├─ save-states
│  ├─ dev
│  ├─ engines
│  └─ learn
└─ unchained-data
   ├─ analytics
   ├─ visualization
   ├─ importers
   ├─ databases
   │  ├─ schemas
   │  ├─ requests
   │  └─ apis
   ├─ pipelines
   └─ learn
```

## Delivery Phases

1. **Foundation**: shared media library, job system, Ollama integration, first image tool.
2. **Core creative suite**: image editing, TTS, data visualization, plugin framework hardening.
3. **Advanced media**: music expansion, video tooling, singing/voice cloning.
4. **Power features**: workflow chaining, collections, embedding search, external integrations.

## Current State: UNCHAINED Music

The existing implementation remains the active alpha and now represents the first ecosystem module.

### Implemented highlights
- Local music import and metadata aggregation (MusicBrainz/Discogs/Spotify/Bandcamp/iTunes XML).
- Field-level attribution, confidence scoring, metadata apply/revert/diff endpoints.
- Multi-artwork support, track relationship modeling, and DJ Studio tooling.
- Desktop integration: notifications, tray actions, updater pilot.

### Quick Links
- [Testing Guide](./TESTING_GUIDE.md)
- [Testing Checklist](./TESTING_CHECKLIST.md)
- [Roadmap](./ROADMAP.md)
- [UI Architecture](./UI_ARCHITECTURE.md)
- [DJ Studio Features](./docs/DJ_STUDIO_FEATURES.md)
- [DJ Effect System](./docs/DJ_EFFECTS_SYSTEM.md)
- [Analytics Backend](./docs/ANALYTICS_BACKEND.md)
- [Known Issues](./docs/KNOWN_ISSUES.md)
- [Contributors](./docs/CONTRIBUTORS.md)

## Dev TL;DR

```powershell
git clone https://github.com/PtiCalin/UNCHAINED.git
cd UNCHAINED
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-desktop.ps1
powershell -ExecutionPolicy Bypass -File scripts\first-run.ps1
```

Build desktop installer:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-desktop.ps1
```

## Vision Guardrails (What UNCHAINED is not)


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

### Distributing to End Users
- Builds produce a Windows NSIS installer (`.exe`).
- Upload the installer from:
  - `frontend\src-tauri\target\release\bundle\nsis\*.exe`
- End users download the `.exe`, run the installer, and it will create Start Menu + Desktop shortcuts.
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
- Not a SaaS chatbot wrapper.
- Not a single-model playground.
- Not cloud-first surveillance software.
- Not a DAW/Photoshop replacement.

## Community & Contributions

Issues and PRs are welcome.
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- PR template: [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)
