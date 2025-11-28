import React, { useEffect, useMemo, useState } from 'react'
import { fetchTracks, type Track } from '../../services/api'
import { Row } from '../../components/spotify/Row'
import { Card } from '../../components/spotify/Card'
import { useNavigate } from 'react-router-dom'

export default function SpotifyHome() {
  const navigate = useNavigate()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchTracks().then(setTracks).finally(() => setLoading(false)) }, [])
  const recent = useMemo(() => tracks.slice(0, 12), [tracks])
  const albums = useMemo(() => {
    const map = new Map<string, Track>()
    tracks.forEach(t => { if (t.album) { const key = t.album + '|' + (t.artist || ''); if (!map.has(key)) map.set(key, t) } })
    return Array.from(map.values()).slice(0, 12)
  }, [tracks])
  const artists = useMemo(() => {
    const map = new Map<string, Track>()
    tracks.forEach(t => { if (t.artist) { const key = t.artist!; if (!map.has(key)) map.set(key, t) } })
    return Array.from(map.values()).slice(0, 12)
  }, [tracks])
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Home</h2>
      <Row title="Recently Added">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (<Card key={`skl-${i}`} title="" loading />))
          : recent.map(t => (
              <Card
                key={t.id}
                title={t.title || 'Unknown'}
                subtitle={t.artist || ''}
                trackId={t.id}
              />
            ))}
      </Row>
      <Row title="Your Albums">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (<Card key={`ska-${i}`} title="" loading />))
          : albums.map(t => (
              <Card
                key={`alb-${t.id}`}
                title={t.album || 'Unknown Album'}
                subtitle={t.artist || ''}
                onClick={() => navigate(`/albums/${encodeURIComponent(t.artist || 'Unknown')}/${encodeURIComponent(t.album || 'Unknown')}`)}
                onPlay={() => { /* play representative track */ }}
              />
            ))}
      </Row>
      <Row title="Your Artists">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (<Card key={`skr-${i}`} title="" loading />))
          : artists.map(t => (
              <Card
                key={`art-${t.id}`]
                title={t.artist || 'Unknown Artist'}
                onClick={() => navigate(`/artists/${encodeURIComponent(t.artist || 'Unknown')}`)}
              />
            ))}
      </Row>
    </div>
  )
}
