import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchTracks, searchTracks, type Track } from '../../services/api'

export const GlobalSearch: React.FC = () => {
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [remote, setRemote] = useState<Track[]>([])
  const [open, setOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetchTracks().then(setTracks).catch(() => {})
  }, [])

  const localResults = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return [] as Track[]
    return tracks.filter(t =>
      (t.title || '').toLowerCase().includes(term) ||
      (t.artist || '').toLowerCase().includes(term) ||
      (t.album || '').toLowerCase().includes(term)
    ).slice(0, 10)
  }, [q, tracks])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setRemote([]); return }
    const ctrl = new AbortController()
    abortRef.current?.abort()
    abortRef.current = ctrl
    const id = setTimeout(() => {
      searchTracks(term, 10).then(setRemote).catch(() => {}).finally(() => {
        if (abortRef.current === ctrl) abortRef.current = null
      })
    }, 200)
    return () => { clearTimeout(id); ctrl.abort() }
  }, [q])

  return (
    <div className="relative">
      <input
        className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 focus-accent"
        placeholder="Search artists, albums, tracks..."
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => setOpen(true)}
      />
      {open && q && (remote.length > 0 || localResults.length > 0) && (
        <div className="absolute mt-1 w-full glass-panel neo-border rounded shadow-lg z-50">
          {(remote.length > 0 ? remote : localResults).map(r => (
            <div key={r.id} className="px-3 py-2 hover:bg-[#222]">
              <div className="text-sm">{r.title || (r.path_audio?.split(/\\\\|\//).pop() ?? 'Unknown')}</div>
              <div className="text-xs text-[#B3B3B3]">{r.artist} — {r.album}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
