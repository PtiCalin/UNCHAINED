import { create } from 'zustand';
import { audioEngine, DeckId, DeckState } from '../audio/audioEngine';
import { upsertCue, addLoop, logFxUsage } from '../services/api';

interface DeckStoreState {
  deck: DeckState;
  deckId: DeckId;
  loadTrack: (trackId: number) => void;
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  setTempo: (tempo: number) => void;
  setPitch: (pitch: number) => void;
  keyShift: (s: number) => void;
  slipToggle: (on: boolean) => void;
  setLoop: (startMs: number, endMs: number) => void;
  clearLoop: () => void;
  setCue: (label: string, positionMs: number) => void;
  jumpTo: (ms: number) => void;
  applyFx: (presetId: string) => void;
  quantizeToggle: (enabled: boolean) => void;
  keyLockToggle: (enabled: boolean) => void;
}

export const createDeckStore = (deckId: DeckId) =>
  create<DeckStoreState>((set) => {
    const unsub = audioEngine.on((e) => {
      if ('deck' in e && e.deck === deckId) {
        set({ deck: { ...audioEngine.getDeck(deckId) } });
      }
    });
    // Note: consumer should call unsub when appropriate (component unmount)
    return {
      deck: audioEngine.getDeck(deckId),
      deckId,
      loadTrack: (trackId) => { audioEngine.loadTrack(deckId, trackId) },
      play: () => audioEngine.play(deckId),
      pause: () => audioEngine.pause(deckId),
      seek: (ms) => audioEngine.seek(deckId, ms),
      setTempo: (tempo) => audioEngine.setTempo(deckId, tempo),
      setPitch: (pitch) => audioEngine.setPitch(deckId, pitch),
      keyShift: (s) => audioEngine.keyShift(deckId, s),
      slipToggle: (on) => audioEngine.slipToggle(deckId, on),
      setLoop: (s, e) => {
        audioEngine.setLoop(deckId, s, e);
        const d = audioEngine.getDeck(deckId);
        if (d.trackId) {
          const lengthMs = Math.max(0, e - s);
          let beats: number | undefined = undefined;
          if (d.bpm) beats = (lengthMs / 60000) * d.bpm;
          addLoop(d.trackId, s, e, beats, true, true).catch(()=>{});
        }
      },
      clearLoop: () => audioEngine.clearLoop(deckId),
      setCue: (label, ms) => {
        audioEngine.setCue(deckId, label, ms);
        const d = audioEngine.getDeck(deckId);
        if (d.trackId) upsertCue(d.trackId, label, ms).catch(()=>{});
      },
      jumpTo: (ms) => audioEngine.jumpTo(deckId, ms),
      applyFx: (presetId) => {
        audioEngine.applyFx(deckId, presetId);
        const d = audioEngine.getDeck(deckId);
        if (d.trackId) {
          const pid = parseInt(presetId, 10);
            if (!Number.isNaN(pid)) logFxUsage(deckId, pid, d.trackId).catch(()=>{});
        }
      },
      quantizeToggle: (enabled) => audioEngine.quantizeToggle(deckId, enabled),
      keyLockToggle: (enabled) => audioEngine.keyLockToggle(deckId, enabled),
    };
  });
