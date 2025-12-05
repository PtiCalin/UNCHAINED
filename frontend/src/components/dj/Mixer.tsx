import React, { useState } from 'react'
import { useDJStore } from '../../store/useDJStore'

export default function Mixer() {
  const { deckA, deckB } = useDJStore()
  const [crossfader, setCrossfader] = useState(0.5) // 0 = full A, 1 = full B
  const [masterVolume, setMasterVolume] = useState(0.8)
  
  // EQ controls for each deck (placeholder)
  const [eqA, setEqA] = useState({ low: 0, mid: 0, high: 0 })
  const [eqB, setEqB] = useState({ low: 0, mid: 0, high: 0 })
  const [volumeA, setVolumeA] = useState(0.8)
  const [volumeB, setVolumeB] = useState(0.8)

  return (
    <div className="bg-[#121212] rounded-lg p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-center">Mixer</h3>

      {/* Master Volume */}
      <div className="mb-6">
        <div className="text-xs text-gray-400 mb-2 text-center">Master Volume</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">🔇</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={e => setMasterVolume(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <div className="text-xs text-gray-500">🔊</div>
          <div className="text-xs text-gray-300 w-10 text-right">{Math.round(masterVolume * 100)}%</div>
        </div>
      </div>

      {/* Deck Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Deck A */}
        <div className="bg-[#1a1a1a] rounded p-3">
          <div className="text-sm font-semibold text-purple-400 mb-3 text-center">Deck A</div>
          
          {/* Volume */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Volume</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumeA}
              onChange={e => setVolumeA(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* EQ */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>High</span>
                <span>{eqA.high.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqA.high}
                onChange={e => setEqA({ ...eqA, high: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Mid</span>
                <span>{eqA.mid.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqA.mid}
                onChange={e => setEqA({ ...eqA, mid: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-green-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Low</span>
                <span>{eqA.low.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqA.low}
                onChange={e => setEqA({ ...eqA, low: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-red-400"
              />
            </div>
          </div>
        </div>

        {/* Deck B */}
        <div className="bg-[#1a1a1a] rounded p-3">
          <div className="text-sm font-semibold text-cyan-400 mb-3 text-center">Deck B</div>
          
          {/* Volume */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Volume</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumeB}
              onChange={e => setVolumeB(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          {/* EQ */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>High</span>
                <span>{eqB.high.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqB.high}
                onChange={e => setEqB({ ...eqB, high: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Mid</span>
                <span>{eqB.mid.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqB.mid}
                onChange={e => setEqB({ ...eqB, mid: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-green-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Low</span>
                <span>{eqB.low.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={eqB.low}
                onChange={e => setEqB({ ...eqB, low: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-red-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Crossfader */}
      <div className="mt-auto">
        <div className="text-xs text-gray-400 mb-2 text-center">Crossfader</div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-purple-400">A</div>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfader}
              onChange={e => setCrossfader(parseFloat(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-purple-600 via-gray-600 to-cyan-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  rgb(147, 51, 234) 0%, 
                  rgb(147, 51, 234) ${crossfader * 100}%, 
                  rgb(6, 182, 212) ${crossfader * 100}%, 
                  rgb(6, 182, 212) 100%)`
              }}
            />
            <div 
              className="absolute top-0 w-1 h-full bg-white rounded pointer-events-none"
              style={{ left: `calc(${crossfader * 100}% - 2px)` }}
            ></div>
          </div>
          <div className="text-sm font-semibold text-cyan-400">B</div>
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          {crossfader < 0.45 ? 'Deck A' : crossfader > 0.55 ? 'Deck B' : 'Center'}
        </div>
      </div>

      {/* VU Meters (placeholder) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-[#1a1a1a] rounded p-2">
          <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded" style={{ width: `${volumeA * 100}%` }}></div>
        </div>
        <div className="bg-[#1a1a1a] rounded p-2">
          <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded" style={{ width: `${volumeB * 100}%` }}></div>
        </div>
      </div>
    </div>
  )
}
