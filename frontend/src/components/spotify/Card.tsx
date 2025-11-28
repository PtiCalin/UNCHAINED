import React from 'react'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  title: string
  subtitle?: string
  cover?: string
  loading?: boolean
  trackId?: number
  onClick?: () => void
  onPlay?: () => void
}

export const Card: React.FC<Props> = ({ title, subtitle, cover, loading, trackId, onClick, onPlay }) => {
  const playStore = useAppStore((s) => s.play)
  if (loading) {
    return (
      <div className="w-40 animate-pulse">
        <div className="w-40 h-40 bg-[#1f1f1f] rounded-lg" />
        <div className="mt-2 h-4 bg-[#1f1f1f] rounded" />
        <div className="mt-1 h-3 bg-[#1a1a1a] rounded w-3/4" />
      </div>
    )
  }
  return (
    <div className="w-40 cursor-pointer" onClick={onClick}>
      <div className="group relative w-40 h-40 bg-[#181818] rounded-lg shadow-md overflow-hidden">
        {cover ? (
          <img src={cover} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
        <button
          className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 rounded-full bg-[#1db954] text-black text-xs"
          onClick={(e) => { e.stopPropagation(); onPlay ? onPlay() : (trackId ? playStore(trackId) : null) }}
          aria-label="Play"
        >
          ▶
        </button>
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium truncate" title={title}>{title}</div>
        {subtitle && <div className="text-xs text-[#B3B3B3] truncate" title={subtitle}>{subtitle}</div>}
      </div>
    </div>
  )
}
