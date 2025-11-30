import React, { useEffect, useState } from 'react'
import { analyticsApi } from '../../services/analytics'

interface StatBlockProps { label: string; value: React.ReactNode }
const StatBlock: React.FC<StatBlockProps> = ({ label, value }) => (
  <div className="p-3 rounded border border-neutral-700 bg-neutral-800/40">
    <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
    <div className="text-lg font-semibold text-neutral-100">{value}</div>
  </div>
)

export default function AnalyticsIndex() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [emb2d, setEmb2d] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [similar, setSimilar] = useState<any[]>([])
  const [similarTrack, setSimilarTrack] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const s = await analyticsApi.getStats(true)
        setStats(s)
        const red = await analyticsApi.reduceEmbeddings(2)
        setEmb2d(red.reduced_embeddings || [])
        const c = await analyticsApi.getClusters('kmeans')
        setClusters(c.clusters || [])
      } catch (e:any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const requestSimilarity = async () => {
    if (!similarTrack) return
    try {
      setError(null)
      const r = await analyticsApi.similarity(Number(similarTrack), 10)
      setSimilar(r.similar_tracks || [])
    } catch (e:any) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        <button
          onClick={async () => {
            setLoading(true)
            try { await analyticsApi.computeStats(); const s = await analyticsApi.getStats(true); setStats(s) } catch(e:any){ setError(e.message) } finally { setLoading(false) }
          }}
          className="px-3 py-1 rounded bg-blue-600 text-sm disabled:opacity-50"
          disabled={loading}
        >Recompute Stats</button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <section>
        <h3 className="text-sm font-medium mb-2 text-neutral-300">Library Overview</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Total Tracks" value={stats?.total_tracks ?? '—'} />
          <StatBlock label="Total Hours" value={stats?.total_duration_hours ?? '—'} />
          <StatBlock label="Avg BPM" value={stats?.average_bpm ?? '—'} />
          <StatBlock label="Genres Tracked" value={stats?.top_genres ? stats.top_genres.length : '—'} />
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-300">Embeddings (2D PCA)</h3>
        <div className="h-64 border border-neutral-700 rounded relative overflow-hidden">
          {emb2d.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">No embeddings</div>}
          <svg className="w-full h-full">
            {emb2d.map((p,i) => (
              <circle key={i} cx={(p.x+1)/2*100+"%"} cy={(p.y+1)/2*100+"%"} r={3} fill="#4f9" />
            ))}
          </svg>
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-300">Clusters (k-means)</h3>
        <div className="max-h-48 overflow-auto border border-neutral-700 rounded divide-y divide-neutral-800 text-sm">
          {clusters.slice(0,200).map(c => (
            <div key={c.track_id} className="px-2 py-1 flex justify-between">
              <span>Track {c.track_id}</span>
              <span className="text-neutral-400">Cluster {c.cluster_id}</span>
            </div>
          ))}
          {clusters.length === 0 && <div className="p-2 text-neutral-500">No clusters</div>}
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-300">Similarity</h3>
        <div className="flex gap-2 items-center">
          <input value={similarTrack} onChange={e=>setSimilarTrack(e.target.value)} placeholder="Track ID" className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-sm w-24" />
          <button onClick={requestSimilarity} className="px-3 py-1 rounded bg-purple-600 text-sm">Query</button>
        </div>
        <div className="text-xs text-neutral-500">Enter a track id with an embedding.</div>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map(s => (
            <div key={s.track_id} className="p-2 rounded border border-neutral-700 bg-neutral-800/40 flex justify-between text-xs">
              <span>Track {s.track_id}</span>
              <span className="text-neutral-400">{s.similarity_score.toFixed(3)}</span>
            </div>
          ))}
          {similar.length === 0 && <div className="text-neutral-500 text-sm">No results</div>}
        </div>
      </section>
    </div>
  )
}
