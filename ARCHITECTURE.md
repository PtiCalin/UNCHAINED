# Architecture Overview

## Layers
- API Layer (FastAPI routers): `/tracks`, `/sources` (ingestion, metadata, SSE, artwork, relations, samples)
- Service Layer: encapsulates external integrations & local operations (MusicBrainz, Discogs, Spotify, iTunes XML parsing, Bandcamp link parsing, local scan, downloads, provenance, fuzzy confidence)
- Persistence: SQLite (`library/db/library.sqlite`) + filesystem (`library/audio`, `library/metadata`, covers via artwork service). Future: Postgres + object storage.
- Frontend: React + Zustand state + Tailwind styling + Tauri shell (tray, updater, dialogs)
- Eventing: SSE stream (`/sources/events/stream`) -> notifications & toasts
- Desktop Packaging: Tauri config + NSIS installer + Updater manifest

## Data Model (Core Tables)
- `tracks`: canonical track metadata (title, artist, album, year, duration_ms, path_audio, path_cover)
- `external_tracks`: indexed references from external sources (spotify, etc.)
- `metadata_candidates`: persisted candidate rows for quality review
- `metadata_attribution`: field-level provenance (value, source, candidate, confidence)
- `download_jobs`: queued audio/resource downloads
- `track_artworks`: multiple cover variants (primary flag)
- `track_relations`: semantic relationships (remix, edit, alternate_version, sample_of, part_of_release)
- `samples`: performance pad slices (start_ms/end_ms/pad_index)

## Provenance Flow
1. User initiates metadata quality search.
2. Candidates generated & scored; optionally persisted with temp_ref.
3. User applies candidate; fields updated; attribution rows inserted.
4. Revert operation restores previous value & recalculates confidence.

## Search Flow
- Local: initial full fetch for small libraries.
- Remote: `/tracks/search` with LIKE queries (placeholder for FTS/indices).

## Desktop Integration
- Tray events → UI navigation / import modal.
- Updater check → emits `update://status` event.
- Folder pick (dialog) → local scan API call → toast result.

## Extensibility Points
- Replace SQLite with Postgres: update `db_utils` & connection handling.
- Add analysis engine: new service module + migration for analysis fields.
- Add FTS: virtual table or separate index table for search.
- Integrate audio engine (DJ): deck state store + WASM DSP module.

## Security Considerations
- Limit external requests to explicit user actions.
- Validate file paths on import & scan (avoid traversal).
- Updater manifest signing (placeholder key now).

## Future Cloud Path
```
Local FS ──► Object Store (covers/audio)
SQLite     ──► Postgres (tracks + provenance)
SSE        ──► WebSocket (scalable events)
Tauri App  ──► PWA + desktop parity
```

## Diagram (Simplified)
```
User ─┬────┐
     │ UI (React/Tauri) ──────┐
Tray │  |-- GlobalSearch       │
     │  |-- Import Modal       │
     │  |-- ToastHost          │
     │                        ▼
     │                FastAPI Routers
     │                /tracks /sources
     │                        │
     │                    Services Layer
     │                (metadata, artwork,
     │                 relations, samples,
     │                 external APIs)
     │                        │
     │                    SQLite + FS
     │                        │
     └────────────────── SSE Stream
```

## Versioning & Releases
- Semantic versioning; alpha stage (<1.0) may include breaking changes.
- CHANGELOG + signed manifest for updates.

## Open Questions
- Strategy for large library indexing (FTS vs external indexer).
- DSP pipeline & latency targets for DJ mixing.
- Cross-platform packaging timeline.
