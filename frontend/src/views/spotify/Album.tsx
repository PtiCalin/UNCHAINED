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
      <div>
        <div className="text-2xl font-semibold">{al}</div>
        <div className="text-sm text-[#B3B3B3]">{a}</div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {filtered.map(t => (
          <Card key={t.id} title={t.title || 'Unknown'} subtitle={t.artist || ''} trackId={t.id} />
        ))}
      </div>
    </div>
  )
}
