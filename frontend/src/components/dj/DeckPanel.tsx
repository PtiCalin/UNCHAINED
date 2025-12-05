import React, { useState } from 'react'
import { useDJStore } from '../../store/useDJStore'
import EffectRack from './EffectRack'

interface DeckPanelProps {
  deckId: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export default function DeckPanel({ deckId }: DeckPanelProps) {
  const deck = useDJStore(s => s.getDeck(deckId))
  const { play, pause, setTempo, setPitch, keyShift, keyLockToggle, quantizeToggle } = useDJStore()
  const [showEffects, setShowEffects] = useState(false)

  const isPlaying = false // TODO: track play state in store

  return (
    <div className="bg-[#121212] rounded-lg p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-purple-400">Deck {deckId}</div>
          {deck.trackId && (
            <div className="text-sm text-gray-400">Track #{deck.trackId}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => quantizeToggle(deckId, !deck.quantize)}
            className={`px-2 py-1 text-xs rounded ${
              deck.quantize ? 'bg-green-600' : 'bg-[#2a2a2a]'
            }`}
          >
            QUANT
          </button>
          <button
            onClick={() => keyLockToggle(deckId, !deck.keyLock)}
            className={`px-2 py-1 text-xs rounded ${
              deck.keyLock ? 'bg-blue-600' : 'bg-[#2a2a2a]'
            }`}
          >
            KEY
          </button>
        </div>
      </div>

      {/* Waveform (placeholder) */}
      <div className="bg-[#0a0a0a] rounded h-24 mb-4 flex items-center justify-center text-gray-600 text-sm">
        Waveform Visualization
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => isPlaying ? pause(deckId) : play(deckId)}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Position</span>
            <span>{(deck.positionMs / 1000).toFixed(1)}s</span>
          </div>
          <div className="bg-[#2a2a2a] h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full" style={{ width: '30%' }}></div>
          </div>
        </div>
      </div>

      {/* Tempo & Pitch */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Tempo</span>
            <span>{((deck.tempo - 1) * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.01"
            value={deck.tempo}
            onChange={e => setTempo(deckId, parseFloat(e.target.value))}
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Pitch</span>
            <span>{deck.pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="0.1"
            value={deck.pitch}
            onChange={e => setPitch(deckId, parseFloat(e.target.value))}
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Key Shift */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Key Shift</span>
          <span>{deck.keyShift > 0 ? '+' : ''}{deck.keyShift} semitones</span>
        </div>
        <input
          type="range"
          min="-12"
          max="12"
          step="1"
          value={deck.keyShift}
          onChange={e => keyShift(deckId, parseInt(e.target.value))}
          className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-green-600"
        />
      </div>

      {/* BPM & Key Info */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#2a2a2a] rounded p-2 text-center">
          <div className="text-xs text-gray-400">BPM</div>
          <div className="text-lg font-semibold">{deck.bpm?.toFixed(1) || '--'}</div>
        </div>
        <div className="bg-[#2a2a2a] rounded p-2 text-center">
          <div className="text-xs text-gray-400">Key</div>
          <div className="text-lg font-semibold">{deck.trackKey || '--'}</div>
        </div>
      </div>

      {/* Effects Toggle */}
      <button
        onClick={() => setShowEffects(!showEffects)}
        className={`w-full py-2 rounded text-sm font-medium mb-2 ${
          showEffects ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#2a2a2a] hover:bg-[#333]'
        }`}
      >
        FX Rack {showEffects ? '▲' : '▼'}
      </button>

      {/* Effect Rack */}
      {showEffects && (
        <div className="mt-2">
          <EffectRack deckId={deckId} />
        </div>
      )}
    </div>
  )
}
