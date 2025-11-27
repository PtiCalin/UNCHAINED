from pathlib import Path
from typing import Dict, Any, List
from ..utils.db_utils import get_db

DB_PATH = Path('library/db/library.sqlite').resolve()

PROVENANCE_FIELDS = ["title", "artist", "album", "year", "duration_ms", "path_cover"]


def record_field_attribution(track_id: int, field_name: str, value: Any, source: str, candidate_id: int, confidence: float):
    if field_name not in PROVENANCE_FIELDS:
        return
    db = get_db(DB_PATH)
    db.execute(
        "INSERT INTO metadata_attribution (track_id, field_name, value, source, candidate_id, confidence, applied_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
        (track_id, field_name, str(value) if value is not None else None, source, candidate_id, confidence)
    )
    db.commit()


def get_attribution(track_id: int) -> List[Dict[str, Any]]:
    db = get_db(DB_PATH)
    rows = db.execute(
        "SELECT field_name, value, source, candidate_id, confidence, applied_at, reverted FROM metadata_attribution WHERE track_id=? ORDER BY applied_at DESC",
        (track_id,)
    ).fetchall()
    return [
        {
            "field_name": r[0],
            "value": r[1],
            "source": r[2],
            "candidate_id": r[3],
            "confidence": r[4],
            "applied_at": r[5],
            "reverted": r[6],
        } for r in rows
    ]


def revert_field(track_id: int, field_name: str):
    if field_name not in PROVENANCE_FIELDS:
        return False
    db = get_db(DB_PATH)
    rows = db.execute(
        "SELECT id, value FROM metadata_attribution WHERE track_id=? AND field_name=? AND reverted=0 ORDER BY applied_at DESC",
        (track_id, field_name)
    ).fetchall()
    if not rows:
        return False
    latest_id, latest_value = rows[0]
    # Mark latest as reverted
    db.execute("UPDATE metadata_attribution SET reverted=1 WHERE id=?", (latest_id,))
    # Determine previous value
    prev_value = None
    if len(rows) > 1:
        prev_value = rows[1][1]
    # Update track row
    field_map = {
        'title': 'title', 'artist': 'artist', 'album': 'album', 'year': 'year', 'duration_ms': 'duration_ms', 'path_cover': 'path_cover'
    }
    column = field_map[field_name]
    db.execute(f"UPDATE tracks SET {column}=? WHERE id=?", (prev_value, track_id))
    db.commit()
    return True
