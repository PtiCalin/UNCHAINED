# UNCHAINED

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688) ![React](https://img.shields.io/badge/frontend-React-61DAFB) ![Tauri](https://img.shields.io/badge/desktop-Tauri-FB8C00)

> A local-first creative AI operating system that unifies generation, editing, provenance, and media memory across image, audio, video, and data.

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
- **UNCHAINED Music (Current module)**
  - Metadata-rich music library, provenance tooling, DJ studio, and audio-centric workflows.
- **Future sibling modules**
  - UNCHAINED Image
  - UNCHAINED Voice
  - UNCHAINED Video
  - UNCHAINED Data

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
│  └─ desktop-shell
├─ unchained-music
├─ unchained-image
├─ unchained-voice
├─ unchained-video
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

- Not a SaaS chatbot wrapper.
- Not a single-model playground.
- Not cloud-first surveillance software.
- Not a DAW/Photoshop replacement.

## Community & Contributions

Issues and PRs are welcome.
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- PR template: [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)
