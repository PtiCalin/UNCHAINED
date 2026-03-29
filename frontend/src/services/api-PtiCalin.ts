export type Track = {
  id: number
  title?: string
  artist?: string
  album?: string
  duration_ms?: number
  path_audio?: string
}

import { API_BASE } from './apiBase';

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/tracks/`)
  if (!res.ok) throw new Error('Failed to fetch tracks')
  return res.json()
}

export async function searchTracks(q: string, limit = 10): Promise<Track[]> {
  const url = `${API_BASE}/tracks/search?q=${encodeURIComponent(q)}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to search tracks')
  return res.json()
}

export type MetadataCandidate = {
  source: string
  title?: string
  artist?: string
  album?: string
  year?: string | number
  length_ms?: number
  cover_url?: string
  score: number
}

export async function fetchMetadataCandidates(params: { artist?: string; album?: string; title?: string; path_audio?: string; discogs_token?: string }): Promise<{ temp_ref: string | null; best: MetadataCandidate | null; candidates: MetadataCandidate[] }> {
  const res = await fetch(`${API_BASE}/sources/metadata/quality`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Failed to fetch metadata candidates')
  return res.json()
}

export async function applyMetadataCandidate(candidate_id: number, track_id: number) {
  const res = await fetch(`${API_BASE}/sources/metadata/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id, track_id })
  })
  if (!res.ok) throw new Error('Failed to apply metadata candidate')
  return res.json()
}

export async function fetchAttribution(track_id: number) {
  const res = await fetch(`${API_BASE}/sources/metadata/attribution/${track_id}`)
  if (!res.ok) throw new Error('Failed to fetch attribution')
  return res.json()
}

export async function revertMetadataField(track_id: number, field_name: string) {
  const res = await fetch(`${API_BASE}/sources/metadata/revert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track_id, field_name })
  })
  if (!res.ok) throw new Error('Failed to revert field')
  return res.json()
}

export async function recalcConfidence(track_id: number) {
  const res = await fetch(`${API_BASE}/sources/metadata/recalc-confidence/${track_id}`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to recalc confidence')
  return res.json()
}

export async function bulkApplyMetadata(items: { candidate_id: number; track_id: number }[]) {
  const res = await fetch(`${API_BASE}/sources/metadata/apply/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  })
  if (!res.ok) throw new Error('Failed bulk apply')
  return res.json()
}

export async function fetchMetadataDiff(track_id: number, temp_ref?: string) {
  const url = `${API_BASE}/sources/metadata/diff/${track_id}` + (temp_ref ? `?temp_ref=${encodeURIComponent(temp_ref)}` : '')
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed diff fetch')
  return res.json()
}

export async function localScan(folder: string, copy = false) {
  const res = await fetch(`${API_BASE}/sources/local/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, copy })
  })
  if (!res.ok) throw new Error('Local scan failed')
  return res.json()
}

// DJ / Analysis / Cues / Loops / FX
export async function fetchAnalysis(trackId: number) {
  const res = await fetch(`${API_BASE}/dj/tracks/${trackId}/analysis`)
  if (!res.ok) throw new Error('No analysis')
  return res.json()
}

export async function upsertCue(trackId: number, label: string, positionMs: number) {
  const res = await fetch(`${API_BASE}/dj/tracks/${trackId}/cues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, position_ms: positionMs })
  })
  if (!res.ok) throw new Error('Cue upsert failed')
  return res.json()
}

export async function deleteCue(trackId: number, cueId: number) {
  const res = await fetch(`${API_BASE}/dj/tracks/${trackId}/cues/${cueId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Cue delete failed')
  return res.json()
}

export async function addLoop(trackId: number, startMs: number, endMs: number, lengthBeats?: number, quantized = true, active = false) {
  const res = await fetch(`${API_BASE}/dj/tracks/${trackId}/loops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_ms: startMs, end_ms: endMs, length_beats: lengthBeats, quantized, active })
  })
  if (!res.ok) throw new Error('Loop add failed')
  return res.json()
}

export async function deleteLoop(trackId: number, loopId: number) {
  const res = await fetch(`${API_BASE}/dj/tracks/${trackId}/loops/${loopId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Loop delete failed')
  return res.json()
}

export async function logFxUsage(deckId: string, presetId: number, trackId: number) {
  const res = await fetch(`${API_BASE}/dj/fx-usage/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id: deckId, preset_id: presetId, track_id: trackId })
  })
  if (!res.ok) throw new Error('FX usage log failed')
  return res.json()
}
