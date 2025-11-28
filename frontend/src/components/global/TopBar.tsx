import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, ViewMode } from '../../store/useAppStore'
import { MediaChoiceModal } from '../MediaChoiceModal'

const modes: { label: string; value: ViewMode; path: string }[] = [
  { label: 'Spotify View', value: 'spotify', path: '/' },
  { label: 'iTunes Pro', value: 'itunesPro', path: '/pro' },
  { label: 'Vinyl Collector', value: 'vinylCollector', path: '/vinyl' },
  { label: 'Minimal Player', value: 'minimal', path: '/minimal' },
  { label: 'Analytics', value: 'analytics', path: '/analytics' },
  { label: 'DJ Studio', value: 'studio', path: '/studio' },
]

export const TopBar: React.FC = () => {
  const navigate = useNavigate()
  const [importOpen, setImportOpen] = useState(false)
  const current = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const onChangeMode = (v: ViewMode) => {
    setView(v)
    const m = modes.find((m) => m.value === v)
    if (m) navigate(m.path)
  }
  const onChooseMedia = (choice: 'local' | 'itunes' | 'bandcamp') => {
    setImportOpen(false)
    if (choice === 'local') navigate('/pro')
    if (choice === 'itunes') navigate('/pro')
    if (choice === 'bandcamp') navigate('/pro')
  }
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-[#181818]">
      <div className="flex items-center gap-3">
        <button className="px-2 py-1 rounded bg-[#2a2a2a]" onClick={toggleSidebar}>☰</button>
        <div className="font-semibold">UNCHAINED</div>
        <select
          className="bg-[#2a2a2a] text-white rounded px-2 py-1"
          value={current}
          onChange={(e) => onChangeMode(e.target.value as ViewMode)}
        >
          {modes.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 max-w-xl mx-4">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button className="px-2 py-1 bg-[#2a2a2a] rounded" onClick={() => setImportOpen(true)}>Import</button>
        <button className="px-2 py-1 bg-[#2a2a2a] rounded">Theme</button>
        <button className="px-2 py-1 bg-[#2a2a2a] rounded">Settings</button>
      </div>
      <MediaChoiceModal open={importOpen} onClose={() => setImportOpen(false)} onChoose={onChooseMedia} />
    </header>
  )
}
