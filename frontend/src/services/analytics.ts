// Frontend analytics API wrapper
import { API_BASE } from './apiBase';

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}

export const analyticsApi = {
  computeEmbeddings: (trackIds?: number[], force = false, modelVersion = 'v1') =>
    apiPost('/analytics/embeddings/compute', { track_ids: trackIds, force_recompute: force, model_version: modelVersion }),
  getEmbeddings: (trackIds?: number[]) => apiGet(`/analytics/embeddings${trackIds && trackIds.length ? `?track_ids=${trackIds.join(',')}` : ''}`),
  reduceEmbeddings: (components = 2) => apiGet(`/analytics/embeddings/reduce?n_components=${components}`),
  computeClusters: (algorithm = 'kmeans', n = 5, force = false) =>
    apiPost('/analytics/clusters/compute', { algorithm, n_clusters: n, force_recompute: force }),
  getClusters: (algorithm?: string) => apiGet(`/analytics/clusters${algorithm ? `?algorithm=${algorithm}` : ''}`),
  computeStats: () => apiPost('/analytics/stats/compute'),
  getStats: (latestOnly = true) => apiGet(`/analytics/stats?latest_only=${latestOnly}`),
  similarity: (trackId: number, topN = 10) => apiGet(`/analytics/similarity/${trackId}?top_n=${topN}`)
};
