import React, { useState } from 'react'
import { fetchMetadataCandidates, applyMetadataCandidate, fetchAttribution } from '../services/api'
import { fetchTracks } from '../services/api'

export default function MetadataTool() {
  const [artist, setArtist] = useState<string>('')
  const [album, setAlbum] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [pathAudio, setPathAudio] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  interface Candidate { id?: number; source: string; title?: string; artist?: string; album?: string; year?: any; length_ms?: number; cover_url?: string; score: number; applied?: number }
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [best, setBest] = useState<Candidate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [tracks, setTracks] = useState<any[]>([])
  const [attribution, setAttribution] = useState<any[]>([])

  const search = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchMetadataCandidates({ artist: artist || undefined, album: album || undefined, title: title || undefined, path_audio: pathAudio || undefined })
      setCandidates(res.candidates)
      setBest(res.best)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTracks = async () => {
    try {
      const t = await fetchTracks()
      setTracks(t)
    } catch (e) {
      // ignore
    }
  }

  const applyCandidate = async (idx: number) => {
    if (selectedTrackId == null) {
      setError('Select a track first')
      return
    }
    const candidate = candidates[idx]
    if (!candidate.id) {
      setError('Candidate has no persistent ID (provide path audio when searching).')
      return
    }
    setLoading(true)
    try {
      await applyMetadataCandidate(candidate.id, selectedTrackId)
      setError(null)
      // Refresh attribution
      const a = await fetchAttribution(selectedTrackId)
      setAttribution(a.attribution)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Metadata Quality Tool</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-2">
          <input className="w-full px-2 py-1 bg-neutral-800 rounded" placeholder="Artist" value={artist} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArtist(e.target.value)} />
          <input className="w-full px-2 py-1 bg-neutral-800 rounded" placeholder="Album" value={album} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlbum(e.target.value)} />
          <input className="w-full px-2 py-1 bg-neutral-800 rounded" placeholder="Title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
          <input className="w-full px-2 py-1 bg-neutral-800 rounded" placeholder="Path Audio (optional)" value={pathAudio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPathAudio(e.target.value)} />
          <button onClick={search} disabled={loading} className="px-3 py-1 bg-blue-600 rounded disabled:opacity-50">Search</button>
        </div>
        <div className="space-y-2">
          <button onClick={loadTracks} className="px-3 py-1 bg-neutral-700 rounded">Load Tracks</button>
          <select className="w-full px-2 py-1 bg-neutral-800 rounded" value={selectedTrackId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTrackId(Number(e.target.value))}>
            <option value="">Select Track for Apply</option>
            {tracks.map(t => <option key={t.id} value={t.id}>{t.id} - {t.title || t.path_audio?.split(/\\\\|\//).pop()}</option>)}
          </select>
        </div>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {best && (
        <div className="p-3 border border-neutral-700 rounded">
          <div className="font-medium">Best Candidate</div>
          <div className="text-sm">{best.title} — {best.artist} | {best.album}</div>
          <div className="text-xs text-neutral-400">Score: {best.score}</div>
        </div>
      )}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Candidates ({candidates.length})</h3>
          <div className="grid gap-2">
            {candidates.map((c, i) => (
              <div key={i} className="p-2 border border-neutral-800 rounded text-sm flex justify-between items-center">
                <div>
                  <div>{c.title} — {c.artist}</div>
                  <div className="text-neutral-500 text-xs">{c.source} | Score {c.score}</div>
                </div>
                <button onClick={() => applyCandidate(i)} className="px-2 py-1 bg-green-600 rounded text-xs">Apply</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {attribution.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Attribution</h3>
          <div className="grid gap-1 text-xs">
            {attribution.map((a, i) => (
              <div key={i} className="flex justify-between border border-neutral-800 rounded px-2 py-1">
                <span>{a.field_name}: {a.value}</span>
                <span className="text-neutral-500">{a.source} (score {a.confidence})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
