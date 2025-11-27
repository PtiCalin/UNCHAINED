import { useEffect, useState } from 'react'
import { fetchTracks, type Track } from '../services/api'

export default function TrackList() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTracks()
      .then(setTracks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading…</div>
  if (error) return <div className="text-red-400">Error: {error}</div>

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Library</h2>
      <div className="grid grid-cols-1 gap-2">
        {tracks.map(t => (
          <div key={t.id} className="p-3 border border-neutral-800 rounded">
            <div className="text-sm text-neutral-400">{t.artist ?? 'Unknown Artist'}</div>
            <div className="font-semibold">{t.title ?? (t.path_audio?.split(/\\\\|\//).pop() ?? 'Unknown')}</div>
            <div className="text-xs text-neutral-500">{t.album ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
