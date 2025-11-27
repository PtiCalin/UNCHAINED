import { create } from 'zustand'

export type ViewMode = 'spotify' | 'itunesPro' | 'vinylCollector' | 'minimal' | 'analytics' | 'studio'

type PlaybackState = 'stopped' | 'playing' | 'paused'

type AppState = {
  currentView: ViewMode
  sidebarOpen: boolean
  selectedTrackIds: number[]
  nowPlayingId?: number
  playbackState: PlaybackState
  setView: (v: ViewMode) => void
  toggleSidebar: () => void
  select: (ids: number[]) => void
  play: (trackId: number) => void
  pause: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'spotify',
  sidebarOpen: true,
  selectedTrackIds: [],
  playbackState: 'stopped',
  setView: (v) => set({ currentView: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  select: (ids) => set({ selectedTrackIds: ids }),
  play: (trackId) => set({ nowPlayingId: trackId, playbackState: 'playing' }),
  pause: () => set({ playbackState: 'paused' }),
}))
