export type Track = {
  id: number
  title?: string
  artist?: string
  album?: string
  duration_ms?: number
  path_audio?: string
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks/`)
  if (!res.ok) throw new Error('Failed to fetch tracks')
  return res.json()
}
