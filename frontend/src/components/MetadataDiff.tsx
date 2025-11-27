import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMetadataDiff, recalcConfidence, revertMetadataField } from '../services/api'

export default function MetadataDiff() {
  const { trackId } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState<any>(null)
  const [attribution, setAttribution] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])

  const load = async () => {
    if (!trackId) return
    setLoading(true)
    setError(null)
    try {
      const diff = await fetchMetadataDiff(Number(trackId))
      setCurrent(diff.current)
      setAttribution(diff.attribution)
      setCandidates(diff.candidates)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [trackId])

  const doRecalc = async () => {
    if (!trackId) return
    try {
      const res = await recalcConfidence(Number(trackId))
      setAttribution(res.attribution)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const revertField = async (field: string) => {
    if (!trackId) return
    try {
      const res = await revertMetadataField(Number(trackId), field)
      setAttribution(res.attribution)
      // Reload current track values
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Metadata Diff — Track {trackId}</h2>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {current && (
        <div className="p-3 border border-neutral-800 rounded">
          <div className="font-medium mb-2">Current Track</div>
          <div className="grid grid-cols-2 gap-x-4 text-sm">
            <div>Title: {current.title || '—'}</div>
            <div>Artist: {current.artist || '—'}</div>
            <div>Album: {current.album || '—'}</div>
            <div>Year: {current.year || '—'}</div>
            <div>Duration: {current.duration_ms || '—'}</div>
            <div>Cover: {current.path_cover ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={doRecalc} className="px-3 py-1 bg-blue-600 rounded text-xs">Recalc Confidence</button>
      </div>
      {attribution.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium">Attribution History</div>
          <div className="space-y-1 text-xs">
            {attribution.map((a, i) => (
              <div key={i} className="border border-neutral-800 rounded p-2 flex justify-between items-center">
                <div>
                  <div>{a.field_name}: {a.value || '—'}</div>
                  <div className="text-neutral-500">{a.source} | conf {a.confidence?.toFixed(2)} | {a.reverted ? 'reverted' : 'active'}</div>
                </div>
                {!a.reverted && <button onClick={() => revertField(a.field_name)} className="px-2 py-1 bg-red-600 rounded">Revert</button>}
              </div>
            ))}
          </div>
        </div>
      )}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium">Candidates (Temp Ref)</div>
          <div className="grid gap-1 text-xs">
            {candidates.map((c, i) => (
              <div key={i} className="border border-neutral-800 rounded p-2">
                <div>{c.title} — {c.artist}</div>
                <div className="text-neutral-500">{c.source} | Score {c.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
