# UNCHAINED

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688) ![React](https://img.shields.io/badge/frontend-React-61DAFB) ![Tauri](https://img.shields.io/badge/desktop-Tauri-FB8C00)

> A local-first creative AI operating system that unifies generation, editing, provenance, and media memory across music, images, video, documents, code, and data. The ultimate library of libraries and creative coordination hub, with built-in collaboration, automation, and full ownership. Private, secure, no cloud lock-in. Automate, collaborate, and build AI workflows on your terms with cross-media intelligence, and true data ownership. No cloud required.

## Product Positioning

UNCHAINED is the **platform**. The current music-focused application is now framed as **UNCHAINED Music**, the first major module in the wider ecosystem.


### Platform-level non-negotiables
- **Local-first execution:** All assets, metadata, models, and workflows run on your machine—never locked to the cloud.
- **Unified, extensible library of libraries:** Music, images, video, documents, code, 3D, games, and data—indexed, related, and queryable as a single knowledge graph.
- **Job-based and automated workflows:** Generation, editing, remixing, conversion, and cross-media automation—run as background jobs, with logs, retry, and orchestration.
- **Plugin and module boundaries:** All capabilities (including AI, automation, and collaboration) are modular, discoverable, and upgradable.
- **Collaboration and coordination:** Built-in multi-user, multi-device, and team workflows—private by default, with granular sharing and audit trails.
- **Provenance and ownership:** Every asset and output stores full lineage, model, parameters, tool version, and source—ensuring true data ownership and reproducibility.
- **Privacy and security:** No cloud lock-in, no forced telemetry, and strong local encryption for sensitive assets and knowledge.
- **AI workflow orchestration:** Compose, automate, and chain AI and creative tools across all domains—music, images, video, docs, code, 3D, and more.

## Product Hierarchy

- **UNCHAINED (Platform)**
  - Core runtime, library of libraries, job engine, model orchestration, plugin/collaboration API, cross-media intelligence.
- **UNCHAINED Audio**
  - Music library, provenance, DJ studio, audio analysis, and editing.
  - Submodules: UNCHAINED Voice, UNCHAINED DJ
- **UNCHAINED Image**
  - Image library, editing, generation, and provenance.
- **UNCHAINED Video**
  - Video library, editing, generation, and provenance.
- **UNCHAINED Docs**
  - Document library, knowledge graph, semantic search, and provenance.
- **UNCHAINED Code**
  - Code library, snippet management, AI codegen, and provenance.
- **UNCHAINED 3D**
  - 3D asset library, model viewer, and editing.
- **UNCHAINED Games**
  - Game asset library, modding, and provenance.
- **UNCHAINED Data**
  - Data library, analytics, and visualization.


## Architecture Blueprint

### Core platform modules
1. **Library Core:** Unified metadata DB, deterministic storage, cross-domain relationships, and provenance tracking for all asset types.
2. **Job & Automation Engine:** Background and scheduled jobs, workflow chaining, and automation across all creative domains.
3. **Model & Workflow Orchestration:** Local registry for AI models, workflow builder for chaining tools and plugins, and health checks.
4. **Plugin & Collaboration Runtime:** Plugins define capabilities, models, automation, and UI; collaboration API for multi-user and team workflows.
5. **Security & Privacy Layer:** Local encryption, granular sharing, and audit logging.

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
│  ├─ voice
│  └─ dj
├─ unchained-image
├─ unchained-video
├─ unchained-docs
├─ unchained-code
├─ unchained-3d
├─ unchained-games
└─ unchained-data
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
