from rapidfuzz import fuzz
from pathlib import Path
from typing import Dict, Any
from ..utils.db_utils import get_db

DB_PATH = Path('library/db/library.sqlite').resolve()

FIELDS = ["title", "artist", "album"]


def recalc_confidence(track_id: int):
    db = get_db(DB_PATH)
    # Fetch track row
    t = db.execute("SELECT id, title, artist, album FROM tracks WHERE id=?", (track_id,)).fetchone()
    if not t:
        return False
    track_vals = {"title": t[1] or "", "artist": t[2] or "", "album": t[3] or ""}
    # Update attribution confidences
    rows = db.execute("SELECT id, field_name, value FROM metadata_attribution WHERE track_id=? AND reverted=0", (track_id,)).fetchall()
    for r in rows:
        attr_id, field_name, value = r
        if field_name in FIELDS and value:
            ratio = fuzz.ratio(track_vals.get(field_name, ""), value) / 100.0
        else:
            ratio = 1.0 if value else 0.0
        db.execute("UPDATE metadata_attribution SET confidence=? WHERE id=?", (ratio, attr_id))
    db.commit()
    return True
