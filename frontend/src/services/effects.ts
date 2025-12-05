/**
 * Effects API Service
 * Handles all effect-related API calls for DJ mixing
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export interface Effect {
  id: number;
  name: string;
  category: string;
  description: string;
  default_params_json: string;
}

export interface FxPreset {
  id: number;
  name: string;
  description: string;
  category: string;
  effects_json: string;
  is_factory: number;
  created_at: string;
}

export interface EffectChainItem {
  id: number;
  deck_id: string;
  slot: number;
  effect_id: number;
  effect_name: string;
  category: string;
  params_json: string;
  enabled: number;
  wet_dry: number;
}

// ==================== EFFECTS ====================

export async function fetchEffects(category?: string): Promise<Effect[]> {
  const url = category 
    ? `${API_BASE}/dj/effects?category=${encodeURIComponent(category)}`
    : `${API_BASE}/dj/effects`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch effects');
  const data = await res.json();
  return data.effects;
}

export async function fetchEffectCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/dj/effects/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.categories;
}

// ==================== PRESETS ====================

export async function fetchFxPresets(category?: string): Promise<FxPreset[]> {
  const url = category
    ? `${API_BASE}/dj/fx-presets/enhanced?category=${encodeURIComponent(category)}`
    : `${API_BASE}/dj/fx-presets/enhanced`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch presets');
  const data = await res.json();
  return data.fx_presets;
}

export async function createFxPreset(
  name: string,
  description: string,
  category: string,
  effects: any[]
): Promise<FxPreset> {
  const res = await fetch(`${API_BASE}/dj/fx-presets/enhanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      category,
      effects_json: JSON.stringify(effects)
    })
  });
  if (!res.ok) throw new Error('Failed to create preset');
  const data = await res.json();
  return data.preset;
}

export async function updateFxPreset(
  presetId: number,
  updates: {
    name?: string;
    description?: string;
    category?: string;
    effects?: any[];
  }
): Promise<void> {
  const body: any = {};
  if (updates.name) body.name = updates.name;
  if (updates.description) body.description = updates.description;
  if (updates.category) body.category = updates.category;
  if (updates.effects) body.effects_json = JSON.stringify(updates.effects);

  const res = await fetch(`${API_BASE}/dj/fx-presets/${presetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to update preset');
}

export async function deleteFxPreset(presetId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/dj/fx-presets/${presetId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete preset');
}

// ==================== DECK EFFECT CHAINS ====================

export async function fetchDeckEffects(deckId: string): Promise<EffectChainItem[]> {
  const res = await fetch(`${API_BASE}/dj/decks/${deckId}/effects`);
  if (!res.ok) throw new Error('Failed to fetch deck effects');
  const data = await res.json();
  return data.effects;
}

export async function addEffectToDeck(
  deckId: string,
  effectName: string,
  slot: number,
  params?: any,
  wetDry: number = 0.5
): Promise<EffectChainItem> {
  const res = await fetch(`${API_BASE}/dj/decks/${deckId}/effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      effect_name: effectName,
      slot,
      params_json: params ? JSON.stringify(params) : undefined,
      wet_dry: wetDry
    })
  });
  if (!res.ok) throw new Error('Failed to add effect to deck');
  const data = await res.json();
  return data.effect;
}

export async function updateDeckEffect(
  chainId: number,
  updates: {
    params?: any;
    wetDry?: number;
    enabled?: boolean;
  }
): Promise<void> {
  const body: any = {};
  if (updates.params) body.params_json = JSON.stringify(updates.params);
  if (updates.wetDry !== undefined) body.wet_dry = updates.wetDry;
  if (updates.enabled !== undefined) body.enabled = updates.enabled;

  const res = await fetch(`${API_BASE}/dj/decks/effects/${chainId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to update effect');
}

export async function removeEffectFromDeck(chainId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/dj/decks/effects/${chainId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to remove effect');
}

export async function clearDeckEffects(deckId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/dj/decks/${deckId}/effects`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to clear effects');
}

export async function applyPresetToDeck(
  deckId: string,
  presetId: number
): Promise<EffectChainItem[]> {
  const res = await fetch(`${API_BASE}/dj/decks/${deckId}/apply-preset/${presetId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to apply preset');
  const data = await res.json();
  return data.effects;
}
