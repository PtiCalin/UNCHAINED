import { create } from 'zustand';
import { audioEngine, DeckId, DeckState } from '../audio/audioEngine';
import { upsertCue, addLoop, logFxUsage } from '../services/api';
import type { EngineEvent } from '../audio/audioEngine';

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

export const useDJStore = create<DJState>((set: (partial: Partial<DJState> | ((state: DJState) => Partial<DJState>), replace?: boolean) => void, get: () => DJState) => {
  // Subscribe to engine events to reflect local state
  audioEngine.on((e: EngineEvent) => {
    set({ lastEvent: e.type });
    if ('deck' in e) {
      const deck: DeckId = e.deck;
      const state: DeckState = audioEngine.getDeck(deck);
      if (deck === 'A') set((s: DJState) => ({ deckA: { ...state } }));
      else if (deck === 'B') set((s: DJState) => ({ deckB: { ...state } }));
      else set((s: DJState) => ({ extraDecks: { ...s.extraDecks, [deck]: { ...state } } }));
    }
    if (e.type === 'cueSet') {
      if (e.deck === 'A') {
        set((s: DJState) => ({ cuesA: [...s.cuesA.filter((c: { label: string }) => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] }));
      } else {
        if (e.deck === 'B') {
          set((s: DJState) => ({ cuesB: [...s.cuesB.filter((c: { label: string }) => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] }));
        } else {
          set((s: DJState) => ({ cuesExtra: { ...s.cuesExtra, [e.deck as DeckId]: [...(s.cuesExtra[e.deck as DeckId] || []).filter((c: { label: string }) => c.label !== e.label), { label: e.label, positionMs: e.positionMs }] } }));
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
    loadTrack: (deck: DeckId, trackId: number) => { audioEngine.loadTrack(deck, trackId) },
    play: (deck: DeckId) => audioEngine.play(deck),
    pause: (deck: DeckId) => audioEngine.pause(deck),
    seek: (deck: DeckId, ms: number) => audioEngine.seek(deck, ms),
    setTempo: (deck: DeckId, tempo: number) => audioEngine.setTempo(deck, tempo),
    setPitch: (deck: DeckId, pitch: number) => audioEngine.setPitch(deck, pitch),
    sync: (from: DeckId, to: DeckId) => audioEngine.sync(from, to),
    keyShift: (deck: DeckId, s: number) => audioEngine.keyShift(deck, s),
    slipToggle: (deck: DeckId, on: boolean) => audioEngine.slipToggle(deck, on),
    setLoop: (deck: DeckId, s: number, e: number) => {
      audioEngine.setLoop(deck, s, e);
      const d: DeckState = get().getDeck(deck);
      if (d.trackId) {
        // persist loop (length_beats approximate if bpm available)
        const lengthMs: number = Math.max(0, e - s);
        let beats: number | undefined = undefined;
        if (d.bpm) beats = (lengthMs / 60000) * d.bpm;
        addLoop(d.trackId, s, e, beats, true, true).catch(()=>{});
      }
    },
    clearLoop: (deck: DeckId) => audioEngine.clearLoop(deck),
    setCue: (deck: DeckId, label: string, ms: number) => {
      audioEngine.setCue(deck, label, ms);
      const d: DeckState = get().getDeck(deck);
      if (d.trackId) {
        upsertCue(d.trackId, label, ms).catch(()=>{});
      }
    },
    jumpTo: (deck: DeckId, ms: number) => audioEngine.jumpTo(deck, ms),
    applyFx: (deck: DeckId, presetId: string) => {
      audioEngine.applyFx(deck, presetId);
      const d: DeckState = get().getDeck(deck);
      if (d.trackId) {
        const pid: number = parseInt(presetId, 10);
        if (!Number.isNaN(pid)) logFxUsage(deck, pid, d.trackId).catch(()=>{});
      }
    },
    quantizeToggle: (deck: DeckId, enabled: boolean) => audioEngine.quantizeToggle(deck, enabled),
    keyLockToggle: (deck: DeckId, enabled: boolean) => audioEngine.keyLockToggle(deck, enabled),
    startRecording: (path: string) => audioEngine.startRecording(path),
    stopRecording: (path: string) => audioEngine.stopRecording(path),
    addDeck: (): DeckId | null => {
      const id: DeckId | null = audioEngine.addDeck();
      if (id) set((s: DJState) => {
        const deckOrder: DeckId[] = [...s.deckOrder, id];
        localStorage.setItem('dj.deckOrder', JSON.stringify(deckOrder));
        return { deckOrder, extraDecks: { ...s.extraDecks, [id]: audioEngine.getDeck(id) } };
      });
      return id;
    },
    removeDeck: (deck: DeckId) => {
      const ok: boolean = audioEngine.removeDeck(deck as DeckId);
      if (ok) set((s: DJState) => {
        // Remove the deck from extraDecks, but always return a Record<DeckId, DeckState> for remaining decks
        const deckOrder: DeckId[] = s.deckOrder.filter((d: DeckId) => d !== deck);
        localStorage.setItem('dj.deckOrder', JSON.stringify(deckOrder));
        const newActive: DeckId = s.activeDeck === deck ? 'A' : s.activeDeck;
        localStorage.setItem('dj.activeDeck', newActive);
        const extraDecks: Record<DeckId, DeckState> = {} as Record<DeckId, DeckState>;
        deckOrder.forEach((d) => {
          if (d !== 'A' && d !== 'B') {
            extraDecks[d] = audioEngine.getDeck(d);
          }
        });
        // Build cuesExtra as a Record<DeckId, { label: string; positionMs: number }[]> for all remaining decks
        const cuesExtra: Record<DeckId, { label: string; positionMs: number }[]> = {} as Record<DeckId, { label: string; positionMs: number }[]>;
        deckOrder.forEach((d) => {
          if (d !== 'A' && d !== 'B') {
            cuesExtra[d] = s.cuesExtra[d] || [];
          }
        });
        return {
          extraDecks,
          deckOrder,
          cuesExtra,
          activeDeck: newActive
        };
      });
      return ok;
    },
    getDeck: (deck: DeckId) => {
      if (deck === 'A') return get().deckA;
      if (deck === 'B') return get().deckB;
      return get().extraDecks[deck] || audioEngine.getDeck(deck);
    },
    setActiveDeck: (deck: DeckId) => {
      set({ activeDeck: deck });
      try { localStorage.setItem('dj.activeDeck', deck); } catch {}
    },
  };
});
