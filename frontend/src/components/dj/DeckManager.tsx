import React from 'react';
import { useDJStore } from '../../store/useDJStore';

export default function DeckManager() {
  const { deckOrder, addDeck, removeDeck, activeDeck, setActiveDeck } = useDJStore();

  return (
    <div className="flex items-center gap-2 bg-[#121212] text-white px-3 py-2 rounded">
      <div className="font-mono text-sm">Decks:</div>
      {deckOrder.map((d) => (
        <button
          key={d}
          className={`px-2 py-1 rounded border ${activeDeck === d ? 'bg-white text-black' : 'bg-[#1a1a1a] text-white'} hover:bg-white hover:text-black transition`}
          onClick={() => setActiveDeck(d)}
        >{d}</button>
      ))}
      <button className="ml-2 px-2 py-1 rounded bg-green-600 hover:bg-green-500" onClick={() => addDeck()}>+ Add</button>
      {deckOrder.length > 2 && (
        <button className="px-2 py-1 rounded bg-red-600 hover:bg-red-500" onClick={() => removeDeck(deckOrder[deckOrder.length - 1])}>- Remove</button>
      )}
      <div className="ml-auto text-xs opacity-70">F1–F6 selects deck • Space/J/K • 1–8 cues</div>
    </div>
  );
}
