import React, { useEffect, useState } from 'react'
import { fetchDeckEffects, addEffectToDeck, clearDeckEffects, applyPresetToDeck, EffectChainItem, Effect, fetchFxPresets, FxPreset } from '../../services/effects'
import EffectUnit from './EffectUnit'
import EffectLibrary from './EffectLibrary'

interface EffectRackProps {
  deckId: string;
}

export default function EffectRack({ deckId }: EffectRackProps) {
  const [chain, setChain] = useState<EffectChainItem[]>([])
  const [showLibrary, setShowLibrary] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [presets, setPresets] = useState<FxPreset[]>([])
  const [nextSlot, setNextSlot] = useState(0)

  const loadChain = async () => {
    try {
      const effects = await fetchDeckEffects(deckId)
      setChain(effects)
      setNextSlot(effects.length > 0 ? Math.max(...effects.map(e => e.slot)) + 1 : 0)
    } catch (err) {
      console.error('Failed to load effects:', err)
    }
  }

  const loadPresets = async () => {
    try {
      const p = await fetchFxPresets()
      setPresets(p)
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  }

  useEffect(() => {
    loadChain()
  }, [deckId])

  useEffect(() => {
    if (showPresets && presets.length === 0) {
      loadPresets()
    }
  }, [showPresets])

  const handleAddEffect = async (effect: Effect) => {
    try {
      await addEffectToDeck(deckId, effect.name, nextSlot)
      await loadChain()
      setShowLibrary(false)
    } catch (err) {
      console.error('Failed to add effect:', err)
    }
  }

  const handleApplyPreset = async (preset: FxPreset) => {
    try {
      await applyPresetToDeck(deckId, preset.id)
      await loadChain()
      setShowPresets(false)
    } catch (err) {
      console.error('Failed to apply preset:', err)
    }
  }

  const handleClear = async () => {
    if (!confirm('Clear all effects from this deck?')) return
    try {
      await clearDeckEffects(deckId)
      await loadChain()
    } catch (err) {
      console.error('Failed to clear effects:', err)
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">FX Chain - Deck {deckId}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
          >
            Presets
          </button>
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
          >
            + Add Effect
          </button>
          {chain.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Effect Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLibrary(false)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <EffectLibrary onSelectEffect={handleAddEffect} />
          </div>
        </div>
      )}

      {/* Preset Browser Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPresets(false)}>
          <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-lg p-4 max-h-[600px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Effect Presets</h3>
            <div className="space-y-2">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#333] rounded transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      {preset.description && (
                        <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {preset.is_factory === 1 && (
                        <span className="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded">
                          Factory
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                        {preset.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Effect Chain */}
      <div className="space-y-2">
        {chain.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No effects active. Click "+ Add Effect" to start.
          </div>
        ) : (
          chain
            .sort((a, b) => a.slot - b.slot)
            .map(effect => (
              <EffectUnit
                key={effect.id}
                effect={effect}
                onUpdate={loadChain}
              />
            ))
        )}
      </div>
    </div>
  )
}
