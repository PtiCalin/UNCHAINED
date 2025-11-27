from pathlib import Path
from typing import List, Dict, Any, Optional
from ..utils.db_utils import get_db
from .cover_service import download_cover_if_needed

DB_PATH = Path('library/db/library.sqlite').resolve()

def list_artworks(track_id: int) -> List[Dict[str, Any]]:
    db = get_db(DB_PATH)
    rows = db.execute("SELECT id, path_cover, source, is_primary, created_at FROM track_artworks WHERE track_id=? ORDER BY created_at DESC", (track_id,)).fetchall()
    return [
        {"id": r[0], "path_cover": r[1], "source": r[2], "is_primary": r[3], "created_at": r[4]} for r in rows
    ]


def add_artwork(track_id: int, cover_url: Optional[str], source: str) -> Dict[str, Any]:
    db = get_db(DB_PATH)
    path_cover = ""
    if cover_url:
        path_cover = download_cover_if_needed(track_id, cover_url)
    # First artwork defaults to primary
    existing = db.execute("SELECT COUNT(*) FROM track_artworks WHERE track_id=?", (track_id,)).fetchone()[0]
    is_primary = 1 if existing == 0 else 0
    cur = db.execute(
        "INSERT INTO track_artworks (track_id, path_cover, source, is_primary, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        (track_id, path_cover, source, is_primary)
    )
    db.commit()
    return {"id": cur.lastrowid, "track_id": track_id, "path_cover": path_cover, "source": source, "is_primary": is_primary}


def set_primary_artwork(artwork_id: int, track_id: int) -> bool:
    db = get_db(DB_PATH)
    row = db.execute("SELECT id FROM track_artworks WHERE id=? AND track_id=?", (artwork_id, track_id)).fetchone()
    if not row:
        return False
    db.execute("UPDATE track_artworks SET is_primary=0 WHERE track_id=?", (track_id,))
    db.execute("UPDATE track_artworks SET is_primary=1 WHERE id=?", (artwork_id,))
    # Reflect in tracks table
    cover_row = db.execute("SELECT path_cover FROM track_artworks WHERE id=?", (artwork_id,)).fetchone()
    if cover_row and cover_row[0]:
        db.execute("UPDATE tracks SET path_cover=? WHERE id=?", (cover_row[0], track_id))
    db.commit()
    return True


def delete_artwork(artwork_id: int, track_id: int) -> bool:
    db = get_db(DB_PATH)
    row = db.execute("SELECT id, is_primary FROM track_artworks WHERE id=? AND track_id=?", (artwork_id, track_id)).fetchone()
    if not row:
        return False
    is_primary = row[1]
    db.execute("DELETE FROM track_artworks WHERE id=?", (artwork_id,))
    if is_primary:
        # Set another as primary if available
        alt = db.execute("SELECT id, path_cover FROM track_artworks WHERE track_id=? ORDER BY created_at DESC LIMIT 1", (track_id,)).fetchone()
        if alt:
            db.execute("UPDATE track_artworks SET is_primary=1 WHERE id=?", (alt[0],))
            if alt[1]:
                db.execute("UPDATE tracks SET path_cover=? WHERE id=?", (alt[1], track_id))
        else:
            db.execute("UPDATE tracks SET path_cover=NULL WHERE id=?", (track_id,))
    db.commit()
    return True
