import React from 'react'
import { useAppStore } from '../../store/useAppStore'

export const BottomPlayer: React.FC = () => {
  const nowPlayingId = useAppStore((s) => s.nowPlayingId)
  const state = useAppStore((s) => s.playbackState)
  const pause = useAppStore((s) => s.pause)
  const play = useAppStore((s) => s.play)
  return (
    <div className="h-16 glass-panel neo-border px-4 flex items-center justify-between relative overflow-hidden">
      <div className="text-sm text-[#B3B3B3]">
        {nowPlayingId ? `Now Playing: #${nowPlayingId}` : 'Nothing playing'}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-primary focus-accent" onClick={() => (state === 'playing' ? pause() : play(nowPlayingId || 0))}>
          {state === 'playing' ? 'Pause' : 'Play'}
        </button>
      </div>
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-1" style={{
        background: 'linear-gradient(90deg, rgba(193,124,255,0.0), rgba(193,124,255,0.8), rgba(193,124,255,0.0))'
      }} />
    </div>
  )
}
