from pathlib import Path
from typing import List, Dict, Any
from ..utils.db_utils import get_db

DB_PATH = Path('library/db/library.sqlite').resolve()


def list_samples(track_id: int) -> List[Dict[str, Any]]:
    db = get_db(DB_PATH)
    rows = db.execute("SELECT id, start_ms, end_ms, path_audio, pad_index, created_at FROM samples WHERE track_id=? ORDER BY pad_index ASC", (track_id,)).fetchall()
    return [
        {"id": r[0], "start_ms": r[1], "end_ms": r[2], "path_audio": r[3], "pad_index": r[4], "created_at": r[5]} for r in rows
    ]


def add_sample(track_id: int, start_ms: int, end_ms: int, pad_index: int, path_audio: str = "") -> Dict[str, Any]:
    if start_ms < 0 or end_ms <= start_ms:
        raise ValueError("Invalid sample time range")
    db = get_db(DB_PATH)
    cur = db.execute(
        "INSERT INTO samples (track_id, start_ms, end_ms, path_audio, pad_index, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
        (track_id, start_ms, end_ms, path_audio, pad_index)
    )
    db.commit()
    return {"id": cur.lastrowid, "track_id": track_id, "start_ms": start_ms, "end_ms": end_ms, "pad_index": pad_index, "path_audio": path_audio}


def delete_sample(track_id: int, sample_id: int) -> bool:
    db = get_db(DB_PATH)
    row = db.execute("SELECT id FROM samples WHERE id=? AND track_id=?", (sample_id, track_id)).fetchone()
    if not row:
        return False
    db.execute("DELETE FROM samples WHERE id=?", (sample_id,))
    db.commit()
    return True
