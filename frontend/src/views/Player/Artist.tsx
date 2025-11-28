import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchTracks, type Track } from '../../services/api'
import { Card } from '../../components/spotify/Card'
import { Row } from '../../components/spotify/Row'

export default function ArtistPage() {
  const { name = '' } = useParams()
  const [tracks, setTracks] = useState<Track[]>([])
  useEffect(() => { fetchTracks().then(setTracks) }, [])
  const filtered = useMemo(() => tracks.filter(t => (t.artist || '').toLowerCase() === decodeURIComponent(name).toLowerCase()), [tracks, name])
  const albums = useMemo(() => {
    const map = new Map<string, Track>()
    filtered.forEach(t => { if (t.album) { const key = t.album!; if (!map.has(key)) map.set(key, t) } })
    return Array.from(map.values())
  }, [filtered])
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden glass-panel neo-border shadow-accent p-6 rounded-[12px]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(800px 300px at 80% 10%, rgba(193,124,255,0.08), transparent)' }} />
        <div className="flex items-end justify-between">
          <div>
            <div className="mono-tag mb-2">ARTIST</div>
            <div className="text-3xl font-extrabold tracking-wide">{decodeURIComponent(name)}</div>
          </div>
          <button className="btn-primary focus-accent">Play Top</button>
        </div>
      </div>
      <Row title="Albums">
        {albums.map(t => (
          <Card key={`alb-${t.id}`} title={t.album || 'Unknown Album'} subtitle={t.artist || ''} />
        ))}
      </Row>
      <Row title="Songs">
        {filtered.map(t => (
          <Card key={t.id} title={t.title || 'Unknown'} subtitle={t.album || ''} trackId={t.id} />
        ))}
      </Row>
    </div>
  )
}
