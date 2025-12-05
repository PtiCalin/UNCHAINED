import React, { useState } from 'react'
import { EffectChainItem, updateDeckEffect, removeEffectFromDeck } from '../../services/effects'

interface EffectUnitProps {
  effect: EffectChainItem;
  onUpdate: () => void;
}

export default function EffectUnit({ effect, onUpdate }: EffectUnitProps) {
  const [params, setParams] = useState(() => {
    try {
      return JSON.parse(effect.params_json)
    } catch {
      return {}
    }
  })
  const [wetDry, setWetDry] = useState(effect.wet_dry)
  const [enabled, setEnabled] = useState(effect.enabled === 1)
  const [expanded, setExpanded] = useState(false)

  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    try {
      await updateDeckEffect(effect.id, { enabled: newEnabled })
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle effect:', err)
      setEnabled(!newEnabled) // revert
    }
  }

  const handleWetDryChange = async (value: number) => {
    setWetDry(value)
    try {
      await updateDeckEffect(effect.id, { wetDry: value })
      onUpdate()
    } catch (err) {
      console.error('Failed to update wet/dry:', err)
    }
  }

  const handleParamChange = async (key: string, value: any) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    try {
      await updateDeckEffect(effect.id, { params: newParams })
      onUpdate()
    } catch (err) {
      console.error('Failed to update params:', err)
    }
  }

  const handleRemove = async () => {
    try {
      await removeEffectFromDeck(effect.id)
      onUpdate()
    } catch (err) {
      console.error('Failed to remove effect:', err)
    }
  }

  return (
    <div className={`bg-[#2a2a2a] rounded-lg p-3 ${!enabled && 'opacity-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={handleToggle}
          className={`w-8 h-8 rounded flex items-center justify-center ${
            enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="font-medium text-sm">{effect.effect_name}</div>
          <div className="text-xs text-gray-400">Slot {effect.slot + 1}</div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-[#333] rounded"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded && 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          onClick={handleRemove}
          className="p-1 hover:bg-red-600/20 text-red-400 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Wet/Dry Mix */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Mix</span>
          <span>{Math.round(wetDry * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={wetDry}
          onChange={e => handleWetDryChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
      </div>

      {/* Parameters (expanded) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#333] space-y-2">
          {Object.entries(params).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
              </div>
              {typeof value === 'number' && (
                <input
                  type="range"
                  min="0"
                  max={key.includes('freq') ? 20000 : key.includes('depth') || key.includes('mix') ? 1 : 100}
                  step={key.includes('freq') ? 10 : key.includes('depth') || key.includes('mix') ? 0.01 : 0.1}
                  value={value}
                  onChange={e => handleParamChange(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
