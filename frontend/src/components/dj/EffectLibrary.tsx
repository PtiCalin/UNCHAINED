import React, { useEffect, useState } from 'react'
import { fetchEffects, fetchEffectCategories, Effect } from '../../services/effects'

interface EffectLibraryProps {
  onSelectEffect: (effect: Effect) => void;
}

export default function EffectLibrary({ onSelectEffect }: EffectLibraryProps) {
  const [effects, setEffects] = useState<Effect[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchEffectCategories().then(setCategories),
      fetchEffects().then(setEffects)
    ]).finally(() => setLoading(false))
  }, [])

  const filteredEffects = selectedCategory
    ? effects.filter(e => e.category === selectedCategory)
    : effects

  if (loading) return <div className="p-4 text-gray-400">Loading effects...</div>

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 max-h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold mb-3">Effect Library</h3>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded text-sm ${
            selectedCategory === null 
              ? 'bg-purple-600 text-white' 
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-sm ${
              selectedCategory === cat 
                ? 'bg-purple-600 text-white' 
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Effect List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredEffects.map(effect => (
          <button
            key={effect.id}
            onClick={() => onSelectEffect(effect)}
            className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#333] rounded transition group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium">{effect.name}</div>
                <div className="text-xs text-gray-400 mt-1">{effect.description}</div>
              </div>
              <div className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded ml-2">
                {effect.category}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredEffects.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No effects found
        </div>
      )}
    </div>
  )
}
