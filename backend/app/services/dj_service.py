from pathlib import Path
from typing import Optional, Dict, Any, List
from ..utils.db_utils import get_db

def upsert_analysis(db_path: Path, track_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db(db_path)
    row = db.execute("SELECT id FROM analysis_results WHERE track_id=?", (track_id,)).fetchone()
    fields = (
        data.get("bpm"), data.get("key"), data.get("waveform_path"),
        data.get("beatgrid_json"), data.get("energy"), data.get("analyzer")
    )
    if row:
        db.execute(
            """
            UPDATE analysis_results SET bpm=?, key=?, waveform_path=?, beatgrid_json=?, energy=?, analyzer=?, analyzed_at=datetime('now')
            WHERE track_id=?
            """,
            (*fields, track_id)
        )
    else:
        db.execute(
            """
            INSERT INTO analysis_results (track_id, bpm, key, waveform_path, beatgrid_json, energy, analyzer, analyzed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (track_id, *fields)
        )
    db.commit()
    out = db.execute("SELECT id, bpm, key, waveform_path, beatgrid_json, energy, analyzer, analyzed_at FROM analysis_results WHERE track_id=?", (track_id,)).fetchone()
    db.close()
    return {
        "id": out[0], "bpm": out[1], "key": out[2], "waveform_path": out[3],
        "beatgrid_json": out[4], "energy": out[5], "analyzer": out[6], "analyzed_at": out[7]
    }

def list_cues(db_path: Path, track_id: int) -> List[Dict[str, Any]]:
    db = get_db(db_path)
    rows = db.execute("SELECT id, label, position_ms, color, hot_index FROM cue_points WHERE track_id=? ORDER BY position_ms", (track_id,)).fetchall()
    db.close()
    return [{"id": r[0], "label": r[1], "position_ms": r[2], "color": r[3], "hot_index": r[4]} for r in rows]

def add_cue(db_path: Path, track_id: int, label: str, position_ms: int, color: Optional[str], hot_index: Optional[int]) -> Dict[str, Any]:
    db = get_db(db_path)
    cur = db.execute(
        """
        INSERT INTO cue_points (track_id, label, position_ms, color, hot_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        (track_id, label, position_ms, color or "#ffffff", hot_index)
    )
    db.commit()
    cue_id = cur.lastrowid
    row = db.execute("SELECT id, label, position_ms, color, hot_index FROM cue_points WHERE id=?", (cue_id,)).fetchone()
    db.close()
    return {"id": row[0], "label": row[1], "position_ms": row[2], "color": row[3], "hot_index": row[4]}

def delete_cue(db_path: Path, track_id: int, cue_id: int) -> bool:
    db = get_db(db_path)
    cur = db.execute("DELETE FROM cue_points WHERE id=? AND track_id=?", (cue_id, track_id))
    db.commit()
    db.close()
    return cur.rowcount > 0

def list_loops(db_path: Path, track_id: int) -> List[Dict[str, Any]]:
    db = get_db(db_path)
    rows = db.execute(
        "SELECT id, start_ms, end_ms, length_beats, quantized, active FROM loops WHERE track_id=? ORDER BY start_ms",
        (track_id,)
    ).fetchall()
    db.close()
    return [{"id": r[0], "start_ms": r[1], "end_ms": r[2], "length_beats": r[3], "quantized": r[4], "active": r[5]} for r in rows]

def add_loop(db_path: Path, track_id: int, start_ms: int, end_ms: int, length_beats: Optional[float], quantized: bool, active: bool) -> Dict[str, Any]:
    db = get_db(db_path)
    cur = db.execute(
        """
        INSERT INTO loops (track_id, start_ms, end_ms, length_beats, quantized, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        (track_id, start_ms, end_ms, length_beats, 1 if quantized else 0, 1 if active else 0)
    )
    db.commit()
    loop_id = cur.lastrowid
    row = db.execute("SELECT id, start_ms, end_ms, length_beats, quantized, active FROM loops WHERE id=?", (loop_id,)).fetchone()
    db.close()
    return {"id": row[0], "start_ms": row[1], "end_ms": row[2], "length_beats": row[3], "quantized": row[4], "active": row[5]}

def delete_loop(db_path: Path, track_id: int, loop_id: int) -> bool:
    db = get_db(db_path)
    cur = db.execute("DELETE FROM loops WHERE id=? AND track_id=?", (loop_id, track_id))
    db.commit()
    db.close()
    return cur.rowcount > 0

def save_deck_state(db_path: Path, deck_id: str, track_id: int, position_ms: int, tempo: float, pitch: float, key_shift: int, slip_mode: bool) -> int:
    db = get_db(db_path)
    cur = db.execute(
        """
        INSERT INTO deck_states (deck_id, track_id, position_ms, tempo, pitch, key_shift, slip_mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """,
        (deck_id, track_id, position_ms, tempo, pitch, key_shift, 1 if slip_mode else 0)
    )
    db.commit()
    did = cur.lastrowid
    db.close()
    return did

def list_recordings(db_path: Path) -> List[Dict[str, Any]]:
    db = get_db(db_path)
    rows = db.execute("SELECT id, path_audio, started_at, finished_at, duration_ms, notes FROM recordings ORDER BY started_at DESC").fetchall()
    db.close()
    return [{"id": r[0], "path_audio": r[1], "started_at": r[2], "finished_at": r[3], "duration_ms": r[4], "notes": r[5]} for r in rows]

def start_recording(db_path: Path, path_audio: Path, notes: Optional[str] = None) -> int:
    db = get_db(db_path)
    cur = db.execute(
        "INSERT INTO recordings (path_audio, started_at, notes) VALUES (?, datetime('now'), ?)",
        (str(path_audio), notes)
    )
    db.commit()
    rid = cur.lastrowid
    db.close()
    return rid

def stop_recording(db_path: Path, rec_id: int, duration_ms: Optional[int] = None) -> bool:
    db = get_db(db_path)
    cur = db.execute(
        "UPDATE recordings SET finished_at=datetime('now'), duration_ms=? WHERE id=?",
        (duration_ms, rec_id)
    )
    db.commit()
    db.close()
    return cur.rowcount > 0

# FX Presets
def list_fx_presets(db_path: Path):
    db = get_db(db_path)
    rows = db.execute("SELECT id, name, params_json, created_at FROM fx_presets ORDER BY created_at DESC").fetchall()
    db.close()
    return [
        {"id": r[0], "name": r[1], "params_json": r[2], "created_at": r[3]} for r in rows
    ]

def add_fx_preset(db_path: Path, name: str, params_json: str):
    db = get_db(db_path)
    cur = db.execute(
        "INSERT INTO fx_presets (name, params_json, created_at) VALUES (?, ?, datetime('now'))",
        (name, params_json)
    )
    db.commit()
    pid = cur.lastrowid
    row = db.execute("SELECT id, name, params_json, created_at FROM fx_presets WHERE id=?", (pid,)).fetchone()
    db.close()
    return {"id": row[0], "name": row[1], "params_json": row[2], "created_at": row[3]}

def delete_fx_preset(db_path: Path, preset_id: int) -> bool:
    db = get_db(db_path)
    cur = db.execute("DELETE FROM fx_presets WHERE id=?", (preset_id,))
    db.commit()
    db.close()
    return cur.rowcount > 0

def log_fx_usage(db_path: Path, deck_id: str, preset_id: int, track_id: int):
    db = get_db(db_path)
    db.execute(
        "INSERT INTO fx_usage (deck_id, preset_id, track_id, applied_at) VALUES (?, ?, ?, datetime('now'))",
        (deck_id, preset_id, track_id)
    )
    db.commit()
    db.close()

def list_fx_usage(db_path: Path, limit: int = 100):
    db = get_db(db_path)
    rows = db.execute(
        "SELECT id, deck_id, preset_id, track_id, applied_at FROM fx_usage ORDER BY applied_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    db.close()
    return [
        {"id": r[0], "deck_id": r[1], "preset_id": r[2], "track_id": r[3], "applied_at": r[4]} for r in rows
    ]

def fetch_analysis(db_path: Path, track_id: int):
    db = get_db(db_path)
    row = db.execute("SELECT id, bpm, key, waveform_path, beatgrid_json, energy, analyzer, analyzed_at FROM analysis_results WHERE track_id=?", (track_id,)).fetchone()
    db.close()
    if not row:
        return None
    return {
        "id": row[0], "bpm": row[1], "key": row[2], "waveform_path": row[3], "beatgrid_json": row[4], "energy": row[5], "analyzer": row[6], "analyzed_at": row[7]
    }
