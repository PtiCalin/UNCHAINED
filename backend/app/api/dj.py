from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
from ..utils.db_utils import init_db
from ..services.dj_service import (
    upsert_analysis, list_cues, add_cue, delete_cue,
    list_loops, add_loop, delete_loop, save_deck_state,
    list_recordings, start_recording, stop_recording,
    list_fx_presets, add_fx_preset, delete_fx_preset,
    log_fx_usage, list_fx_usage, fetch_analysis
)

LIBRARY_DB = Path("library/db/library.sqlite").resolve()
init_db(LIBRARY_DB)

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
