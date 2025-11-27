import React from 'react'
import { useAppStore } from '../../store/useAppStore'

export const BottomPlayer: React.FC = () => {
  const nowPlayingId = useAppStore((s) => s.nowPlayingId)
  const state = useAppStore((s) => s.playbackState)
  const pause = useAppStore((s) => s.pause)
  const play = useAppStore((s) => s.play)
  return (
    <div className="h-14 border-t border-[#222] bg-[#181818] px-4 flex items-center justify-between">
      <div className="text-sm text-[#B3B3B3]">{nowPlayingId ? `Now Playing: #${nowPlayingId}` : 'Nothing playing'}</div>
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 bg-[#2a2a2a] rounded" onClick={() => (state === 'playing' ? pause() : play(nowPlayingId || 0))}>
          {state === 'playing' ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  )
}
