import { create } from 'zustand';
import { audioEngine, DeckId, DeckState } from '../audio/audioEngine';
import { upsertCue, addLoop, logFxUsage } from '../services/api';

interface DJState {
  deckA: DeckState;
  deckB: DeckState;
  extraDecks: Record<DeckId, DeckState>; // dynamic decks beyond A/B
  deckOrder: DeckId[]; // current active deck IDs
  activeDeck: DeckId;
  cuesA: { label: string; positionMs: number }[];
  cuesB: { label: string; positionMs: number }[];
  cuesExtra: Record<DeckId, { label: string; positionMs: number }[]>;
  recordingPath?: string;
  lastEvent?: string;
  loadTrack: (deck: DeckId, trackId: number) => void;
  play: (deck: DeckId) => void;
  pause: (deck: DeckId) => void;
  seek: (deck: DeckId, ms: number) => void;
  setTempo: (deck: DeckId, tempo: number) => void;
  setPitch: (deck: DeckId, pitch: number) => void;
  sync: (from: DeckId, to: DeckId) => void;
  keyShift: (deck: DeckId, s: number) => void;
  slipToggle: (deck: DeckId, on: boolean) => void;
  setLoop: (deck: DeckId, startMs: number, endMs: number) => void;
  clearLoop: (deck: DeckId) => void;
  setCue: (deck: DeckId, label: string, positionMs: number) => void;
  jumpTo: (deck: DeckId, ms: number) => void;
  applyFx: (deck: DeckId, presetId: string) => void;
  startRecording: (path: string) => void;
  stopRecording: (path: string) => void;
  quantizeToggle: (deck: DeckId, enabled: boolean) => void;
  keyLockToggle: (deck: DeckId, enabled: boolean) => void;
  addDeck: () => DeckId | null;
  removeDeck: (deck: DeckId) => boolean;
  getDeck: (deck: DeckId) => DeckState;
  setActiveDeck: (deck: DeckId) => void;
}

export const useDJStore = create<DJState>((set, get) => {
  // Subscribe to engine events to reflect local state
  audioEngine.on((e) => {
    set({ lastEvent: e.type });
    if ('deck' in e) {
      const deck = e.deck;
      const state = audioEngine.getDeck(deck);
      if (deck === 'A') set({ deckA: { ...state } });
      else if (deck === 'B') set({ deckB: { ...state } });
      else set((s) => ({ extraDecks: { ...s.extraDecks, [deck]: { ...state } } }));
    }
    if (e.type === 'cueSet') {
      if (e.deck === 'A') {
        set((s) => ({ cuesA: [...s.cuesA.filter(c => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] }));
      } else {
        if (e.deck === 'B') {
          set((s) => ({ cuesB: [...s.cuesB.filter(c => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] }));
        } else {
          set((s) => ({ cuesExtra: { ...s.cuesExtra, [e.deck]: [...(s.cuesExtra[e.deck] || []).filter(c => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] } }));
        }
      }
    }
    if (e.type === 'recordingStart') set({ recordingPath: e.path });
    if (e.type === 'recordingStop') set({ recordingPath: undefined });
  });

  // initialize persisted deckOrder / activeDeck
  const persistedOrder = (() => {
    try {
      const raw = localStorage.getItem('dj.deckOrder');
      if (!raw) return ['A','B'] as DeckId[];
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((d: any) => typeof d === 'string') as DeckId[];
    } catch {}
    return ['A','B'] as DeckId[];
  })();
  const persistedActive = (() => {
    try {
      const s = localStorage.getItem('dj.activeDeck');
      if (s && typeof s === 'string') return s as DeckId;
    } catch {}
    return 'A' as DeckId;
  })();

  // ensure engine has these decks
  persistedOrder.forEach((id) => audioEngine.getDeck(id));

  return {
    deckA: audioEngine.getDeck('A'),
    deckB: audioEngine.getDeck('B'),
    extraDecks: Object.fromEntries(persistedOrder.filter(d => d !== 'A' && d !== 'B').map(d => [d, audioEngine.getDeck(d)])) as Record<DeckId, DeckState>,
    deckOrder: persistedOrder,
    activeDeck: persistedActive,
    cuesA: [],
    cuesB: [],
    cuesExtra: {},
    recordingPath: undefined,
    lastEvent: undefined,
    loadTrack: (deck, trackId) => { audioEngine.loadTrack(deck, trackId) },
    play: (deck) => audioEngine.play(deck),
    pause: (deck) => audioEngine.pause(deck),
    seek: (deck, ms) => audioEngine.seek(deck, ms),
    setTempo: (deck, tempo) => audioEngine.setTempo(deck, tempo),
    setPitch: (deck, pitch) => audioEngine.setPitch(deck, pitch),
    sync: (from, to) => audioEngine.sync(from, to),
    keyShift: (deck, s) => audioEngine.keyShift(deck, s),
    slipToggle: (deck, on) => audioEngine.slipToggle(deck, on),
    setLoop: (deck, s, e) => {
      audioEngine.setLoop(deck, s, e);
      const d = get().getDeck(deck);
      if (d.trackId) {
        // persist loop (length_beats approximate if bpm available)
        const lengthMs = Math.max(0, e - s);
        let beats: number | undefined = undefined;
        if (d.bpm) beats = (lengthMs / 60000) * d.bpm;
        addLoop(d.trackId, s, e, beats, true, true).catch(()=>{});
      }
    },
    clearLoop: (deck) => audioEngine.clearLoop(deck),
    setCue: (deck, label, ms) => {
      audioEngine.setCue(deck, label, ms);
      const d = get().getDeck(deck);
      if (d.trackId) {
        upsertCue(d.trackId, label, ms).catch(()=>{});
      }
    },
    jumpTo: (deck, ms) => audioEngine.jumpTo(deck, ms),
    applyFx: (deck, presetId) => {
      audioEngine.applyFx(deck, presetId);
      const d = get().getDeck(deck);
      if (d.trackId) {
        const pid = parseInt(presetId, 10);
        if (!Number.isNaN(pid)) logFxUsage(deck, pid, d.trackId).catch(()=>{});
      }
    },
    quantizeToggle: (deck, enabled) => audioEngine.quantizeToggle(deck, enabled),
    keyLockToggle: (deck, enabled) => audioEngine.keyLockToggle(deck, enabled),
    startRecording: (path) => audioEngine.startRecording(path),
    stopRecording: (path) => audioEngine.stopRecording(path),
    addDeck: () => {
      const id = audioEngine.addDeck();
      if (id) set((s) => {
        const deckOrder = [...s.deckOrder, id];
        localStorage.setItem('dj.deckOrder', JSON.stringify(deckOrder));
        return { deckOrder, extraDecks: { ...s.extraDecks, [id]: audioEngine.getDeck(id) } };
      });
      return id;
    },
    removeDeck: (deck) => {
      const ok = audioEngine.removeDeck(deck as DeckId);
      if (ok) set((s) => {
        const { [deck]: _, ...rest } = s.extraDecks;
        const deckOrder = s.deckOrder.filter(d => d !== deck);
        localStorage.setItem('dj.deckOrder', JSON.stringify(deckOrder));
        const newActive = s.activeDeck === deck ? 'A' : s.activeDeck;
        localStorage.setItem('dj.activeDeck', newActive);
        return { extraDecks: rest, deckOrder, cuesExtra: Object.fromEntries(Object.entries(s.cuesExtra).filter(([k]) => k !== deck)), activeDeck: newActive };
      });
      return ok;
    },
    getDeck: (deck) => {
      if (deck === 'A') return get().deckA;
      if (deck === 'B') return get().deckB;
      return get().extraDecks[deck] || audioEngine.getDeck(deck);
    },
    setActiveDeck: (deck) => {
      set({ activeDeck: deck });
      try { localStorage.setItem('dj.activeDeck', deck); } catch {}
    },
  };
});
