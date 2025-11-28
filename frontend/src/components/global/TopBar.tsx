import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, ViewMode } from '../../store/useAppStore'
import { MediaChoiceModal } from '../MediaChoiceModal'
import { listen } from '@tauri-apps/api/event'

const modes: { label: string; value: ViewMode; path: string }[] = [
  { label: 'Player', value: 'spotify', path: '/' },
  { label: 'Library', value: 'itunesPro', path: '/pro' },
  { label: 'Collection', value: 'vinylCollector', path: '/vinyl' },
  { label: 'Focus', value: 'minimal', path: '/minimal' },
  { label: 'Dashboard', value: 'analytics', path: '/analytics' },
  { label: 'Studio', value: 'studio', path: '/studio' },
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
  useEffect(() => {
    let unlisten: (() => void) | null = null
    // Listen for tray event to open import modal
    try {
      listen('tray://import-folder', () => setImportOpen(true)).then((fn) => { unlisten = fn })
    } catch {}
    // Also support window dispatch from main.tsx fallback
    const handler = () => setImportOpen(true)
    window.addEventListener('tray-import-folder', handler)
    return () => { if (unlisten) unlisten(); window.removeEventListener('tray-import-folder', handler) }
  }, [])
  return (
    <header className="flex items-center justify-between px-4 py-3 neo-border glass-panel">
      <div className="flex items-center gap-3">
        <button className="btn-brutal focus-accent" onClick={toggleSidebar}>☰</button>
        <div className="font-semibold tracking-wide">UNCHAINED</div>
        <select
          className="btn-brutal focus-accent"
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
        <button className="btn-primary shadow-accent focus-accent" onClick={() => setImportOpen(true)}>Import</button>
        <button className="btn-brutal focus-accent">Theme</button>
        <button className="btn-brutal focus-accent">Settings</button>
      </div>
      <MediaChoiceModal open={importOpen} onClose={() => setImportOpen(false)} onChoose={onChooseMedia} />
    </header>
  )
}
