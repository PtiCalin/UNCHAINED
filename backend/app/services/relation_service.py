from pathlib import Path
from typing import List, Dict, Any
from ..utils.db_utils import get_db

DB_PATH = Path('library/db/library.sqlite').resolve()

VALID_RELATION_TYPES = {"remix", "edit", "alternate_version", "sample_of", "part_of_release"}


def list_relations(track_id: int) -> List[Dict[str, Any]]:
    db = get_db(DB_PATH)
    rows = db.execute("SELECT id, related_track_id, relation_type, created_at FROM track_relations WHERE track_id=? ORDER BY created_at DESC", (track_id,)).fetchall()
    return [
        {"id": r[0], "related_track_id": r[1], "relation_type": r[2], "created_at": r[3]} for r in rows
    ]


def add_relation(track_id: int, related_track_id: int, relation_type: str) -> Dict[str, Any]:
    if relation_type not in VALID_RELATION_TYPES:
        raise ValueError("Invalid relation_type")
    db = get_db(DB_PATH)
    # avoid duplicates
    existing = db.execute("SELECT id FROM track_relations WHERE track_id=? AND related_track_id=? AND relation_type=?", (track_id, related_track_id, relation_type)).fetchone()
    if existing:
        return {"id": existing[0], "track_id": track_id, "related_track_id": related_track_id, "relation_type": relation_type, "created_at": None}
    cur = db.execute(
        "INSERT INTO track_relations (track_id, related_track_id, relation_type, created_at) VALUES (?, ?, ?, datetime('now'))",
        (track_id, related_track_id, relation_type)
    )
    db.commit()
    return {"id": cur.lastrowid, "track_id": track_id, "related_track_id": related_track_id, "relation_type": relation_type}


def delete_relation(track_id: int, relation_id: int) -> bool:
    db = get_db(DB_PATH)
    row = db.execute("SELECT id FROM track_relations WHERE id=? AND track_id=?", (relation_id, track_id)).fetchone()
    if not row:
        return False
    db.execute("DELETE FROM track_relations WHERE id=?", (relation_id,))
    db.commit()
    return True
