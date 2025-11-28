# UI Architecture (Canonical)

This document defines the canonical UI plan for UNCHAINED.

## Global Principles
- Modular views; desktop-first responsive behaviors
- Layered (TopBar, Sidebar, Main, BottomPlayer); DJ Studio overrides
- Dual modes: casual display, data-view

## App Shell
- `TopBar`: logo, mode selector, global search, settings/theme, view options
- `Sidebar`: navigation sections (Primary, Metadata, Utility, User Tools)
- `Main`: active view
- `BottomPlayer`: global player

## Modes & Views
- Player (formerly Spotify View): grid browsing; Home, Artist, Album
- Library (formerly iTunes Pro): table + right inspector; virtualized columns, editable metadata
- Collection (formerly Vinyl Collector): horizontal release timeline; artwork cards and fold-out details
- Focus (formerly Minimal Player): fullscreen aesthetic player
- Dashboard (formerly Analytics): graphs (BPM, Key Wheel, Mood Map, Genre Clusters, PCA, Artist Graph, Timeline Heatmap)
- Studio (formerly DJ Studio): full override; Decks A/B, Mixer, Pad Grid, Recorder

## Navigation
- Routes: `/` (Player Home), `/pro` (Library), `/vinyl` (Collection), `/minimal` (Focus), `/analytics` (Dashboard), `/studio` (Studio)
- Mode selector updates route + global `currentView`

## State Management
- Zustand store: `currentView`, `sidebarOpen`, selection, filters/sorts, nowPlaying, playback state
- DJ store: deck states (future)

## Interaction Rules
- Click open; double-click play; Space play/pause; Ctrl/Cmd+F search; drag files to import
- Grid hover play affordances; table row highlights

## Accessibility & Responsiveness
- Keyboard navigation, ARIA roles, high-contrast and large-text modes
- Desktop-first with collapsible sidebar under 1024px; DJ Studio scales vertically on small screens

## Animations
- Framer Motion: page fades, card scale-ins, waveform reveal, timeline inertia; respect reduced-motion

## Files & Structure
- `layouts/AppShell.tsx` — master shell
- `components/global/TopBar.tsx`, `Sidebar.tsx`, `BottomPlayer.tsx`
- `views/*` — per-mode directories
- `store/useAppStore.ts` — global state
- `services/notifications.ts` — SSE-based desktop notifications

## Desktop Integration
- Tauri config (`frontend/src-tauri/tauri.conf.json`) allowlist notifications; system tray menu
- System tray handlers implemented in `frontend/src-tauri/src/main.rs` with menu items: Open Library, Import Folder, Exit
- Frontend listens for Tauri tray events in `frontend/src/main.tsx` and navigates accordingly

## Roadmap (UI)
1. M1: AppShell + Spotify-like Home cards/rows, global search
2. M2: iTunes Pro-like database views (TanStack Table + virtualization) + Inspector
3. M3: Vinyl timeline + release details
4. M4: Minimal Player polish + audio engine wrapper
5. M5: Analytics dashboards (Recharts/VisX)
6. M6: DJ Studio deck/mixer/pad interactions + recorder
