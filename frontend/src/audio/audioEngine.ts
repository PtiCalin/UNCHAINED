// Advanced audio engine stub with beatgrid, quantize, keyLock, slip buffering
export type DeckId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type EngineEvent =
  | { type: 'trackLoaded'; deck: DeckId; trackId: number }
  | { type: 'play'; deck: DeckId }
  | { type: 'pause'; deck: DeckId }
  | { type: 'seek'; deck: DeckId; positionMs: number }
  | { type: 'tempoChange'; deck: DeckId; tempo: number }
  | { type: 'pitchChange'; deck: DeckId; pitch: number }
  | { type: 'sync'; from: DeckId; to: DeckId }
  | { type: 'keyShift'; deck: DeckId; semitones: number }
  | { type: 'slipToggle'; deck: DeckId; enabled: boolean }
  | { type: 'loopSet'; deck: DeckId; startMs: number; endMs: number }
  | { type: 'loopClear'; deck: DeckId }
  | { type: 'cueSet'; deck: DeckId; label: string; positionMs: number }
  | { type: 'cueJump'; deck: DeckId; positionMs: number }
  | { type: 'fxApply'; deck: DeckId; presetId: string }
  | { type: 'recordingStart'; path: string }
  | { type: 'recordingStop'; path: string };

export interface DeckState {
  trackId?: number;
  positionMs: number;
  tempo: number;
  pitch: number;
  keyShift: number;
  keyLock: boolean;
  slip: boolean;
  slipBufferMs?: number;
  quantize: boolean;
  loop?: { startMs: number; endMs: number } | null;
  bpm?: number;
  beatgrid?: number[];
  trackKey?: string;
}

const defaultDeck: DeckState = {
  positionMs: 0,
  tempo: 1.0,
  pitch: 0,
  keyShift: 0,
  keyLock: true,
  slip: false,
  quantize: true,
  loop: null,
  bpm: undefined,
  beatgrid: undefined,
  trackKey: undefined,
};

class AudioEngine {
  private decks: Record<DeckId, DeckState> = {
    A: { ...defaultDeck },
    B: { ...defaultDeck },
    C: { ...defaultDeck },
    D: { ...defaultDeck },
    E: { ...defaultDeck },
    F: { ...defaultDeck },
  };
  private listeners: Set<(e: EngineEvent) => void> = new Set();

  getDeckIds(): DeckId[] {
    return Object.keys(this.decks) as DeckId[];
  }

  addDeck(): DeckId | null {
    const order: DeckId[] = ['A','B','C','D','E','F'];
    for (const id of order) {
      if (!this.decks[id]) {
        this.decks[id] = { ...defaultDeck };
        return id;
      }
    }
    return null; // max reached
  }

  removeDeck(id: DeckId): boolean {
    if (id === 'A' || id === 'B') return false; // keep base decks
    if (!this.decks[id]) return false;
    delete this.decks[id];
    return true;
  }

  on(listener: (e: EngineEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(e: EngineEvent) {
    this.listeners.forEach((l) => l(e));
  }

  async loadTrack(deck: DeckId, trackId: number) {
    const d = this.getDeck(deck);
    d.trackId = trackId;
    d.positionMs = 0;
    // Fetch analysis for beatgrid/bpm/key
    try {
      const base = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000';
      const res = await fetch(`${base}/dj/tracks/${trackId}/analysis`);
      if (res.ok) {
        const json = await res.json();
        const a = json.analysis;
        d.bpm = a.bpm;
        d.trackKey = a.key;
        if (a.beatgrid_json) {
          try {
            const bg = JSON.parse(a.beatgrid_json);
            if (Array.isArray(bg)) d.beatgrid = bg.filter((v: any) => typeof v === 'number').sort((a: number, b: number) => a - b);
          } catch {}
        }
      }
    } catch {}
    this.emit({ type: 'trackLoaded', deck, trackId });
  }

  play(deck: DeckId) {
    this.emit({ type: 'play', deck });
  }

  pause(deck: DeckId) {
    this.emit({ type: 'pause', deck });
  }

  seek(deck: DeckId, positionMs: number) {
    const d = this.getDeck(deck);
    const snapped = this.quantizeIfNeeded(d, positionMs);
    d.positionMs = Math.max(0, snapped);
    this.emit({ type: 'seek', deck, positionMs: d.positionMs });
  }

  setTempo(deck: DeckId, tempo: number) {
    const d = this.getDeck(deck);
    d.tempo = Math.max(0.5, Math.min(tempo, 2.0));
    this.emit({ type: 'tempoChange', deck, tempo: d.tempo });
  }

  setPitch(deck: DeckId, pitch: number) {
    const d = this.getDeck(deck);
    d.pitch = Math.max(-50, Math.min(pitch, 50));
    this.emit({ type: 'pitchChange', deck, pitch: d.pitch });
  }

  sync(from: DeckId, to: DeckId) {
    const f = this.getDeck(from);
    const t = this.getDeck(to);
    t.tempo = f.tempo;
    t.pitch = f.pitch;
    if (f.beatgrid && f.beatgrid.length > 1 && t.beatgrid && t.beatgrid.length > 1) {
      const targetPos = this.findNearestBeat(t, t.positionMs);
      const sourcePos = this.findNearestBeat(f, f.positionMs);
      const offset = sourcePos - targetPos;
      t.positionMs = Math.max(0, t.positionMs + offset);
    }
    this.emit({ type: 'sync', from, to });
  }

  keyShift(deck: DeckId, semitones: number) {
    const d = this.getDeck(deck);
    d.keyShift = Math.max(-12, Math.min(semitones, 12));
    this.emit({ type: 'keyShift', deck, semitones: d.keyShift });
  }

  keyLockToggle(deck: DeckId, enabled: boolean) {
    const d = this.getDeck(deck);
    d.keyLock = enabled;
    this.emit({ type: 'keyShift', deck, semitones: d.keyShift });
  }

  slipToggle(deck: DeckId, enabled: boolean) {
    const d = this.getDeck(deck);
    d.slip = enabled;
    this.emit({ type: 'slipToggle', deck, enabled });
    if (!enabled && d.slipBufferMs != null) {
      d.positionMs = d.slipBufferMs;
      d.slipBufferMs = undefined;
    }
  }

  setLoop(deck: DeckId, startMs: number, endMs: number) {
    const d = this.getDeck(deck);
    if (endMs <= startMs) {
      d.loop = null;
      this.emit({ type: 'loopClear', deck });
      return;
    }
    const qStart = this.quantizeIfNeeded(d, startMs);
    const qEnd = this.quantizeIfNeeded(d, endMs);
    d.loop = { startMs: qStart, endMs: qEnd };
    this.emit({ type: 'loopSet', deck, startMs: qStart, endMs: qEnd });
  }

  clearLoop(deck: DeckId) {
    const d = this.getDeck(deck);
    d.loop = null;
    this.emit({ type: 'loopClear', deck });
  }

  setCue(deck: DeckId, label: string, positionMs: number) {
    const d = this.getDeck(deck);
    const snapped = this.quantizeIfNeeded(d, positionMs);
    this.emit({ type: 'cueSet', deck, label, positionMs: snapped });
  }

  jumpTo(deck: DeckId, positionMs: number) {
    const d = this.getDeck(deck);
    const snapped = this.quantizeIfNeeded(d, positionMs);
    if (d.slip) {
      d.slipBufferMs = (d.slipBufferMs ?? d.positionMs) + (snapped - d.positionMs);
    }
    d.positionMs = Math.max(0, snapped);
    this.emit({ type: 'cueJump', deck, positionMs: d.positionMs });
  }

  applyFx(deck: DeckId, presetId: string) {
    this.emit({ type: 'fxApply', deck, presetId });
  }

  startRecording(path: string) {
    this.emit({ type: 'recordingStart', path });
  }

  stopRecording(path: string) {
    this.emit({ type: 'recordingStop', path });
  }

  quantizeToggle(deck: DeckId, enabled: boolean) {
    const d = this.getDeck(deck);
    d.quantize = enabled;
  }

  private quantizeIfNeeded(d: DeckState, ms: number): number {
    if (!d.quantize || !d.beatgrid || d.beatgrid.length === 0) return ms;
    return this.findNearestBeat(d, ms);
  }

  private findNearestBeat(d: DeckState, ms: number): number {
    if (!d.beatgrid || d.beatgrid.length === 0) return ms;
    let best = d.beatgrid[0];
    let diff = Math.abs(ms - best);
    for (const b of d.beatgrid) {
      const dff = Math.abs(ms - b);
      if (dff < diff) {
        diff = dff;
        best = b;
      }
    }
    return best;
  }

  getDeck(deck: DeckId): DeckState {
    if (!this.decks[deck]) {
      // auto-create if within allowed range
      if (['C','D','E','F'].includes(deck)) {
        this.decks[deck as DeckId] = { ...defaultDeck };
      } else {
        this.decks[deck as DeckId] = { ...defaultDeck };
      }
    }
    return this.decks[deck];
  }
}

export const audioEngine = new AudioEngine();
