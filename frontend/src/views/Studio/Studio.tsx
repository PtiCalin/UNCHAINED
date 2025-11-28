import React from 'react'
import DeckManager from '../../components/dj/DeckManager'

export default function DJStudio() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white p-4">
      <div className="mb-4"><DeckManager /></div>
      <div className="grid grid-cols-[1fr_320px_1fr] gap-4">
        <div className="h-[60vh] bg-[#121212] rounded">Deck A — waveform, controls</div>
        <div className="h-[60vh] bg-[#121212] rounded">Mixer — crossfader, EQ</div>
        <div className="h-[60vh] bg-[#121212] rounded">Deck B — waveform, controls</div>
      </div>
      <div className="mt-4 h-48 bg-[#121212] rounded">Pad Grid — samples/loops</div>
    </div>
  )
}
