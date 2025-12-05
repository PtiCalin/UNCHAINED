from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from ..utils.db_utils import init_db
from ..services.dj_service import (
    upsert_analysis, list_cues, add_cue, delete_cue,
    list_loops, add_loop, delete_loop, save_deck_state,
    list_recordings, start_recording, stop_recording,
    list_fx_presets, add_fx_preset, delete_fx_preset,
    log_fx_usage, list_fx_usage, fetch_analysis
)
from ..services.effect_service import (
    initialize_effect_library, list_effects, get_effect_categories,
    list_fx_presets_enhanced, add_fx_preset_enhanced, update_fx_preset,
    get_deck_effect_chain, add_effect_to_chain, update_effect_params,
    remove_effect_from_chain, clear_deck_effects, apply_preset_to_deck
)

LIBRARY_DB = Path("library/db/library.sqlite").resolve()
init_db(LIBRARY_DB)

# Initialize effect library on startup
try:
    initialize_effect_library(LIBRARY_DB)
except Exception as e:
    print(f"Effect library initialization: {e}")

router = APIRouter()

class AnalyzeBody(BaseModel):
    bpm: Optional[float] = None
    key: Optional[str] = None
    waveform_path: Optional[str] = None
    beatgrid_json: Optional[str] = None
    energy: Optional[float] = None
    analyzer: Optional[str] = "basic"

@router.post("/tracks/{track_id}/analyze")
def analyze_track(track_id: int, body: AnalyzeBody):
    result = upsert_analysis(LIBRARY_DB, track_id, body.dict())
    return {"analysis": result}

class CueBody(BaseModel):
    label: str
    position_ms: int
    color: Optional[str] = None
    hot_index: Optional[int] = None

@router.get("/tracks/{track_id}/cues")
def get_cues(track_id: int):
    return {"cues": list_cues(LIBRARY_DB, track_id)}

@router.post("/tracks/{track_id}/cues")
def add_cue_point(track_id: int, body: CueBody):
    cue = add_cue(LIBRARY_DB, track_id, body.label, body.position_ms, body.color, body.hot_index)
    return {"cue": cue, "cues": list_cues(LIBRARY_DB, track_id)}

@router.delete("/tracks/{track_id}/cues/{cue_id}")
def delete_cue_point(track_id: int, cue_id: int):
    ok = delete_cue(LIBRARY_DB, track_id, cue_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Cue not found")
    return {"status": "deleted", "cues": list_cues(LIBRARY_DB, track_id)}

class LoopBody(BaseModel):
    start_ms: int
    end_ms: int
    length_beats: Optional[float] = None
    quantized: bool = True
    active: bool = False

@router.get("/tracks/{track_id}/loops")
def get_loops(track_id: int):
    return {"loops": list_loops(LIBRARY_DB, track_id)}

@router.post("/tracks/{track_id}/loops")
def add_loop_point(track_id: int, body: LoopBody):
    loop = add_loop(LIBRARY_DB, track_id, body.start_ms, body.end_ms, body.length_beats, body.quantized, body.active)
    return {"loop": loop, "loops": list_loops(LIBRARY_DB, track_id)}

@router.delete("/tracks/{track_id}/loops/{loop_id}")
def delete_loop_point(track_id: int, loop_id: int):
    ok = delete_loop(LIBRARY_DB, track_id, loop_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Loop not found")
    return {"status": "deleted", "loops": list_loops(LIBRARY_DB, track_id)}

class DeckStateBody(BaseModel):
    deck_id: str
    track_id: int
    position_ms: int
    tempo: float
    pitch: float
    key_shift: int = 0
    slip_mode: bool = False
    key_lock: bool = False
    quantize: bool = True

@router.post("/decks/state/save")
def save_state(body: DeckStateBody):
    did = save_deck_state(LIBRARY_DB, body.deck_id, body.track_id, body.position_ms, body.tempo, body.pitch, body.key_shift, body.slip_mode)
    return {"deck_state_id": did}

class RecordingStartBody(BaseModel):
    path_audio: str
    notes: Optional[str] = None

@router.post("/recordings/start")
def start_rec(body: RecordingStartBody):
    rid = start_recording(LIBRARY_DB, Path(body.path_audio), body.notes)
    return {"recording_id": rid}

class RecordingStopBody(BaseModel):
    recording_id: int
    duration_ms: Optional[int] = None

@router.post("/recordings/stop")
def stop_rec(body: RecordingStopBody):
    ok = stop_recording(LIBRARY_DB, body.recording_id, body.duration_ms)
    if not ok:
        raise HTTPException(status_code=404, detail="Recording not found")
    return {"status": "stopped"}

@router.get("/recordings")
def recordings_list():
    return {"recordings": list_recordings(LIBRARY_DB)}

class FxPresetBody(BaseModel):
    name: str
    params_json: str  # JSON string describing chain & parameters

@router.get("/fx-presets")
def fx_presets_list():
    return {"fx_presets": list_fx_presets(LIBRARY_DB)}

@router.post("/fx-presets")
def fx_presets_add(body: FxPresetBody):
    preset = add_fx_preset(LIBRARY_DB, body.name, body.params_json)
    return {"preset": preset, "fx_presets": list_fx_presets(LIBRARY_DB)}

@router.delete("/fx-presets/{preset_id}")
def fx_presets_delete(preset_id: int):
    ok = delete_fx_preset(LIBRARY_DB, preset_id)
    if not ok:
        raise HTTPException(status_code=404, detail="FX preset not found")
    return {"status": "deleted", "fx_presets": list_fx_presets(LIBRARY_DB)}

class FxUsageBody(BaseModel):
    deck_id: str
    preset_id: int
    track_id: int

@router.post("/fx-usage/log")
def fx_usage_log(body: FxUsageBody):
    log_fx_usage(LIBRARY_DB, body.deck_id, body.preset_id, body.track_id)
    return {"status": "logged"}

@router.get("/fx-usage")
def fx_usage_list(limit: int = 100):
    return {"fx_usage": list_fx_usage(LIBRARY_DB, limit)}

@router.get("/tracks/{track_id}/analysis")
def get_track_analysis(track_id: int):
    data = fetch_analysis(LIBRARY_DB, track_id)
    if not data:
        raise HTTPException(status_code=404, detail="No analysis")
    return {"analysis": data}

# ==================== ENHANCED EFFECTS API ====================

@router.get("/effects")
def get_effects_list(category: Optional[str] = None):
    """List all available effects, optionally filtered by category"""
    effects = list_effects(LIBRARY_DB, category)
    return {"effects": effects}

@router.get("/effects/categories")
def get_categories():
    """Get all effect categories"""
    categories = get_effect_categories(LIBRARY_DB)
    return {"categories": categories}

class FxPresetCreateBody(BaseModel):
    name: str
    description: str = ""
    category: str
    effects_json: str

@router.get("/fx-presets/enhanced")
def fx_presets_list_enhanced(category: Optional[str] = None):
    """List all FX presets with enhanced details"""
    presets = list_fx_presets_enhanced(LIBRARY_DB, category)
    return {"fx_presets": presets}

@router.post("/fx-presets/enhanced")
def fx_presets_add_enhanced(body: FxPresetCreateBody):
    """Create a new custom FX preset"""
    preset = add_fx_preset_enhanced(LIBRARY_DB, body.name, body.description, body.category, body.effects_json)
    return {"preset": preset}

class FxPresetUpdateBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    effects_json: Optional[str] = None

@router.put("/fx-presets/{preset_id}")
def fx_preset_update(preset_id: int, body: FxPresetUpdateBody):
    """Update an existing preset (cannot update factory presets)"""
    ok = update_fx_preset(LIBRARY_DB, preset_id, body.name, body.description, body.category, body.effects_json)
    if not ok:
        raise HTTPException(status_code=403, detail="Cannot update factory preset or preset not found")
    return {"status": "updated"}

@router.get("/decks/{deck_id}/effects")
def get_deck_effects(deck_id: str):
    """Get active effect chain for a deck"""
    chain = get_deck_effect_chain(LIBRARY_DB, deck_id)
    return {"deck_id": deck_id, "effects": chain}

class AddEffectBody(BaseModel):
    effect_name: str
    slot: int
    params_json: Optional[str] = None
    wet_dry: float = 0.5

@router.post("/decks/{deck_id}/effects")
def add_deck_effect(deck_id: str, body: AddEffectBody):
    """Add an effect to a deck's chain at specified slot"""
    try:
        effect = add_effect_to_chain(LIBRARY_DB, deck_id, body.effect_name, body.slot, body.params_json, body.wet_dry)
        return {"effect": effect}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

class UpdateEffectBody(BaseModel):
    params_json: Optional[str] = None
    wet_dry: Optional[float] = None
    enabled: Optional[bool] = None

@router.put("/decks/effects/{chain_id}")
def update_deck_effect(chain_id: int, body: UpdateEffectBody):
    """Update parameters of an effect in a deck's chain"""
    ok = update_effect_params(LIBRARY_DB, chain_id, body.params_json, body.wet_dry, body.enabled)
    if not ok:
        raise HTTPException(status_code=404, detail="Effect not found")
    return {"status": "updated"}

@router.delete("/decks/effects/{chain_id}")
def remove_deck_effect(chain_id: int):
    """Remove an effect from a deck's chain"""
    ok = remove_effect_from_chain(LIBRARY_DB, chain_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Effect not found")
    return {"status": "removed"}

@router.delete("/decks/{deck_id}/effects")
def clear_all_deck_effects(deck_id: str):
    """Clear all effects from a deck"""
    clear_deck_effects(LIBRARY_DB, deck_id)
    return {"status": "cleared"}

@router.post("/decks/{deck_id}/apply-preset/{preset_id}")
def apply_fx_preset(deck_id: str, preset_id: int):
    """Apply a preset's effect chain to a deck"""
    try:
        chain = apply_preset_to_deck(LIBRARY_DB, deck_id, preset_id)
        return {"deck_id": deck_id, "effects": chain}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
