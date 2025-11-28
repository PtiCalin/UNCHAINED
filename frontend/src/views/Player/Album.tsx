import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchTracks, type Track } from '../../services/api'
import { Card } from '../../components/spotify/Card'

export default function AlbumPage() {
  const { artist = '', album = '' } = useParams()
  const a = decodeURIComponent(artist)
  const al = decodeURIComponent(album)
  const [tracks, setTracks] = useState<Track[]>([])
  useEffect(() => { fetchTracks().then(setTracks) }, [])
  const filtered = useMemo(() => tracks.filter(t => (t.artist || '') === a && (t.album || '') === al), [tracks, a, al])
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden glass-panel neo-border shadow-accent p-6 rounded-[12px]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 250px at 10% 10%, rgba(193,124,255,0.08), transparent)' }} />
        <div className="flex items-end justify-between">
          <div>
            <div className="mono-tag mb-2">ALBUM</div>
            <div className="text-3xl font-extrabold tracking-wide">{al}</div>
            <div className="text-sm text-[#B3B3B3]">{a}</div>
          </div>
          <button className="btn-primary focus-accent">Play All</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {filtered.map(t => (
          <Card key={t.id} title={t.title || 'Unknown'} subtitle={t.artist || ''} trackId={t.id} />
        ))}
      </div>
    </div>
  )
}
