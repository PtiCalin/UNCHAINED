# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- Local folder scan with toast feedback
- Updater pilot and tray "Check for Updates" action
- Global search wired to backend /tracks/search
- Toast notification system
- Installer (NSIS) configuration in Tauri
- README enhancement (feature matrix, FAQ, privacy, standards)

### Changed
- View folder refactor to new naming (Player, Library, Collection, Focus, Dashboard, Studio)

### Security
- Placeholder pubkey for updater (to be replaced with real signing key)

## [0.1.0] - 2025-11-01
### Added
- Initial FastAPI backend with track import
- Metadata aggregation (MusicBrainz, Discogs) and apply/revert/diff endpoints
- Multi artwork variants and track relations
- Samples (pad slice registration)
- React/Tauri frontend shell with Player home and library table scaffold
- SSE notifications

### Notes
Alpha foundation release — expect schema evolution.

[Unreleased]: https://github.com/PtiCalin/UNCHAINED/compare/0.1.0...HEAD
[0.1.0]: https://github.com/PtiCalin/UNCHAINED/releases/tag/0.1.0
