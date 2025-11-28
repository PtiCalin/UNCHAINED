import React, { useEffect, useMemo, useState } from 'react'
import { fetchTracks, type Track } from '../../services/api'

export const GlobalSearch: React.FC = () => {
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchTracks().then(setTracks).catch(() => {})
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return [] as Track[]
    return tracks.filter(t =>
      (t.title || '').toLowerCase().includes(term) ||
      (t.artist || '').toLowerCase().includes(term) ||
      (t.album || '').toLowerCase().includes(term)
    ).slice(0, 10)
  }, [q, tracks])

  return (
    <div className="relative">
      <input
        className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
        placeholder="Search artists, albums, tracks..."
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => setOpen(true)}
      />
      {open && q && results.length > 0 && (
        <div className="absolute mt-1 w-full bg-[#181818] border border-[#333] rounded shadow-lg z-50">
          {results.map(r => (
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
