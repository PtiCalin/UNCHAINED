import React from 'react'
import DeckManager from '../../components/dj/DeckManager'
import DeckPanel from '../../components/dj/DeckPanel'
import Mixer from '../../components/dj/Mixer'

export default function DJStudio() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white p-4">
      {/* Deck Manager */}
      <div className="mb-4">
        <DeckManager />
      </div>

      {/* Main Layout: Deck A | Mixer | Deck B */}
      <div className="grid grid-cols-[1fr_380px_1fr] gap-4 mb-4">
        <div className="h-[70vh]">
          <DeckPanel deckId="A" />
        </div>
        <div className="h-[70vh]">
          <Mixer />
        </div>
        <div className="h-[70vh]">
          <DeckPanel deckId="B" />
        </div>
      </div>

      {/* Bottom Section: Sampler Pad Grid (placeholder) */}
      <div className="bg-[#121212] rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Sampler Pads</h3>
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 16 }, (_, i) => (
            <button
              key={i}
              className="aspect-square bg-[#2a2a2a] hover:bg-[#333] rounded-lg flex items-center justify-center text-sm font-medium transition"
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

