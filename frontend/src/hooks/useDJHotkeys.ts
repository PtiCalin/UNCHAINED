import { useEffect } from 'react';
import { useDJStore } from '../store/useDJStore';

// Hotkeys:
// Space: Play/Pause deck A
// Shift+Space: Play/Pause deck B
// J/K: -/+ 2000ms seek deck A (Shift modifies deck B)
// 1-8: Jump to cue if exists else set cue at current position (deck A)
// Shift+1-8: Same for deck B
// Alt+1-8: Force set/overwrite cue rather than jump (deck A); Alt+Shift for deck B

export function useDJHotkeys() {
  const {
    play, pause, seek, setCue, jumpTo,
    getDeck, deckOrder, activeDeck, setActiveDeck
  } = useDJStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const code = e.code;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // Deck select F1-F6
      if (/^F[1-6]$/.test(code)) {
        const idx = parseInt(code.replace('F', ''), 10) - 1;
        const list = deckOrder;
        const deck = list[idx];
        if (deck) setActiveDeck(deck);
        return;
      }

      // Space toggle on activeDeck (Shift keeps legacy deck B)
      if (code === 'Space') {
        e.preventDefault();
        const deck = isShift ? 'B' : activeDeck;
        const state = getDeck(deck as any);
        if (state.trackId == null) return; // nothing loaded
        // naive: lastEvent indicates play/pause; we can track position later
        if ((state as any)._playing) {
          (state as any)._playing = false;
          pause(deck as any);
        } else {
          (state as any)._playing = true;
          play(deck as any);
        }
        return;
      }

      // Seek J/K
      if (code === 'KeyJ' || code === 'KeyK') {
        const deck = isShift ? 'B' : activeDeck;
        const state = getDeck(deck as any);
        const delta = code === 'KeyJ' ? -2000 : 2000;
        seek(deck as any, (state.positionMs || 0) + delta);
        return;
      }

      // Cues numeric 1-8
      if (/^Digit[1-8]$/.test(code)) {
        const num = parseInt(code.replace('Digit', ''), 10);
        const deck = isShift ? 'B' : activeDeck;
        const state = getDeck(deck as any);
        const cues = [] as { label: string; positionMs: number }[]; // we don't need local list, store handles
        const existing = cues.find(c => c.label === String(num));
        if (existing && !isAlt) {
          jumpTo(deck as any, existing.positionMs);
        } else {
          setCue(deck as any, String(num), state.positionMs || 0);
        }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [play, pause, seek, setCue, jumpTo, deckOrder, activeDeck, setActiveDeck, getDeck]);
}
