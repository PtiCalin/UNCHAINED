# UNCHAINED — Full Software Testing Guide

## 1. Installation

### Development Setup
```powershell
git clone https://github.com/PtiCalin/UNCHAINED.git
cd UNCHAINED
# Backend
cd backend
pip install -r requirements.txt
# Frontend
cd ../frontend
npm install
```

### Desktop Build (Tauri)
```powershell
cd frontend
npm run tauri build
# Run installer from dist/
```

---

## 2. Backend API

- Start FastAPI server:
  ```powershell
  cd backend
  $env:PYTHONPATH="c:\\Users\\charl\\OneDrive\\Projets\\UNCHAINED\\backend"; python -m uvicorn app.main:app --reload
  ```
- Confirm API health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Test endpoints:
  - `/tracks/` — list tracks
  - `/tracks/search?q=` — search tracks
  - `/sources/local/scan` — scan/import local media
  - `/dj/*` — DJ features (analysis, cues, loops, FX, deck state, recordings)

---

## 3. Frontend & Desktop App

- Start frontend (web):
  ```powershell
  cd frontend
  npm run dev
  ```
- Or run desktop app (after build/install).

---

## 4. Media Ingestion

- Use UI or tray menu to import local folders.
- Confirm:
  - Media appears in Library.
  - Metadata is extracted.
  - Toast notifications show results.
  - Provenance and confidence scores are visible.

---

## 5. Core Views

- **Player:** Play, seek, view waveform.
- **Library:** Browse, search, filter, sort.
- **Collection:** Timeline/history.
- **Focus:** Minimal player.
- **Dashboard:** Analytics, import stats.
- **Studio:** Multi-deck DJ interface.

Test navigation, rendering, and search in each view.

---

## 6. Multi-Deck DJ Studio

- Add/remove decks (up to 6) via DeckManager.
- Select active deck (F1–F6 or click).
- Load tracks, play/pause, seek, set/jump cues, set loops, apply FX.
- Test quantize, key-lock, slip toggles.
- Confirm backend persistence for cues/loops/FX usage.
- Use hotkeys:
  - F1–F6: select deck
  - Space/J/K/1–8: control active deck
  - Shift: always targets deck B

---

## 7. Remix & Advanced Features

- Use Pad Grid for samples/loops.
- Set multiple cues per deck.
- Sync decks (tempo/beat alignment).
- Test slip mode, quantize, key-lock.
- Apply FX presets, check usage logs.
- Dynamic deck management.

---

## 8. Desktop Integration

- Tray menu: open library, import folder, check for updates.
- Toast notifications for all major actions.
- Installer/updater workflow (NSIS, Tauri).
- Confirm update status events and logs.

---

## 9. Metadata & Provenance

- Test multi-source metadata aggregation (Spotify, iTunes, Bandcamp, MusicBrainz, Discogs).
- Apply/revert/diff metadata.
- Check field-level provenance and confidence recalculation.

---

## 10. Documentation & Repository Materials

- Review README, CHANGELOG, CODE_OF_CONDUCT, SECURITY, CONTRIBUTING, ARCHITECTURE.
- Confirm issue templates and release notes.
- Validate architecture diagrams and feature matrix.

---

## 11. General QA

- Restart app, confirm deckOrder and activeDeck persist.
- Validate error handling (invalid media, failed imports).
- Check all toast notifications and SSE events.
- Test installer and updater on Windows.

---

## 12. Troubleshooting

- Backend/Frontend logs for errors.
- Media import: check file permissions and formats.
- Hotkeys: ensure browser/app window is focused.
- API: test endpoints with curl/Postman if needed.

---

## 13. Optional: Automated Test Cases

- Write Cypress or Playwright scripts for UI flows.
- Use pytest for backend API endpoint tests.

---

# Testing Checklist

- [ ] Install backend and frontend dependencies
- [ ] Build and run desktop app (Tauri)
- [ ] Start backend API and confirm health
- [ ] Import media from local folder
- [ ] Confirm media appears in Library
- [ ] Test all core views (Player, Library, Collection, Focus, Dashboard, Studio)
- [ ] Add/remove decks in Studio, select active deck
- [ ] Load tracks into decks, play/pause, seek, set/jump cues, set loops, apply FX
- [ ] Test quantize, key-lock, slip toggles
- [ ] Confirm cues/loops/FX usage are persisted
- [ ] Use Pad Grid for samples/loops
- [ ] Sync decks, test beat alignment
- [ ] Apply/revert/diff metadata, check provenance
- [ ] Use tray menu actions
- [ ] Confirm toast notifications for all actions
- [ ] Test installer/updater workflow
- [ ] Validate documentation and repo materials
- [ ] Restart app, confirm deckOrder/activeDeck persistence
- [ ] Test error handling and troubleshooting steps
- [ ] (Optional) Run automated test scripts

---
