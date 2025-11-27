from fastapi import APIRouter, HTTPException
from fastapi import UploadFile, File
from fastapi import BackgroundTasks
from typing import List
from ..models.track_model import Track, TrackCreate
from ..utils.db_utils import get_db, init_db
from ..services.metadata_service import extract_metadata
import os
from pathlib import Path

LIBRARY_AUDIO = Path("library/audio").resolve()
LIBRARY_METADATA = Path("library/metadata").resolve()
LIBRARY_DB = Path("library/db/library.sqlite").resolve()

router = APIRouter()

# Ensure directories exist
for p in [LIBRARY_AUDIO, LIBRARY_METADATA, LIBRARY_DB.parent]:
    p.mkdir(parents=True, exist_ok=True)

init_db(LIBRARY_DB)

@router.get("/")
def list_tracks() -> List[Track]:
    db = get_db(LIBRARY_DB)
    rows = db.execute("SELECT id, title, artist, album, duration_ms, path_audio FROM tracks ORDER BY import_date DESC").fetchall()
    return [Track(
        id=row[0], title=row[1], artist=row[2], album=row[3], duration_ms=row[4], path_audio=row[5]
    ) for row in rows]

@router.get("/{id}")
def get_track(id: int) -> Track:
    db = get_db(LIBRARY_DB)
    row = db.execute("SELECT id, title, artist, album, duration_ms, path_audio FROM tracks WHERE id=?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Track not found")
    return Track(id=row[0], title=row[1], artist=row[2], album=row[3], duration_ms=row[4], path_audio=row[5])

@router.post("/import")
def import_track(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Save uploaded file to library/audio
    filename = os.path.basename(file.filename)
    dest_path = LIBRARY_AUDIO / filename
    with open(dest_path, "wb") as f:
        f.write(file.file.read())

    # Extract metadata and store
    meta = extract_metadata(dest_path)

    # Store JSON metadata
    json_path = LIBRARY_METADATA / f"{dest_path.stem}.json"
    with open(json_path, "w", encoding="utf-8") as jf:
        import json
        json.dump(meta, jf, ensure_ascii=False, indent=2)

    # Insert into DB
    db = get_db(LIBRARY_DB)
    cur = db.execute(
        """
        INSERT INTO tracks (title, artist, album, year, duration_ms, path_audio, path_metadata, genre, import_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """,
        (
            meta.get("title"), meta.get("artist"), meta.get("album"), meta.get("year"),
            meta.get("duration_ms"), str(dest_path), str(json_path), meta.get("genre")
        )
    )
    db.commit()
    track_id = cur.lastrowid

    return {"track_id": track_id, "message": "Imported"}
