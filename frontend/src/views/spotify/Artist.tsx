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
      <div className="text-2xl font-semibold">{decodeURIComponent(name)}</div>
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
