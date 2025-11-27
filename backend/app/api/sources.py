from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi import BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from ..utils.db_utils import get_db, init_db
from ..services.spotify_service import fetch_spotify_playlist_tracks
from ..services.itunes_service import import_itunes_library
from ..services.bandcamp_service import parse_bandcamp_links
from ..services.download_service import enqueue_downloads
from ..services.musicbrainz_service import search_musicbrainz_release
from ..services.discogs_service import search_discogs_release
from ..services.soundcloud_service import resolve_soundcloud_tracks
from ..services.local_scan_service import scan_local_folder
from ..services.metadata_quality_service import aggregate_metadata, persist_candidates, derive_temp_ref, choose_best, apply_candidate, fetch_candidates_by_temp_ref
from ..services.metadata_provenance_service import get_attribution, revert_field
from ..services.fuzzy_confidence_service import recalc_confidence
from ..services.artwork_service import list_artworks, add_artwork, set_primary_artwork, delete_artwork
from ..services.relation_service import list_relations, add_relation, delete_relation
from ..services.samples_service import list_samples, add_sample, delete_sample

LIBRARY_DB = Path("library/db/library.sqlite").resolve()
LIBRARY_AUDIO = Path("library/audio").resolve()
LIBRARY_METADATA = Path("library/metadata").resolve()

router = APIRouter()
init_db(LIBRARY_DB)

# Simple in-memory event broadcaster for SSE
import asyncio
event_queue: asyncio.Queue = asyncio.Queue()

class SpotifyImportRequest(BaseModel):
    playlist_url: str
    client_id: str
    client_secret: str

class ITunesImportRequest(BaseModel):
    library_xml_path: str
    copy_files: bool = True

class BandcampImportRequest(BaseModel):
    # Provide a text file of authorized download links or bandcamp purchase csv exported by user
    links_text: Optional[str] = None

class DownloadEnqueueRequest(BaseModel):
    urls: List[str]
    subdir: Optional[str] = None

@router.post("/spotify/playlists/import")
async def import_spotify_playlist(body: SpotifyImportRequest):
    tracks = fetch_spotify_playlist_tracks(body.playlist_url, body.client_id, body.client_secret)
    if not tracks:
        raise HTTPException(status_code=404, detail="No tracks found or unauthorized")
    # Store external references in DB for future matching/downloads
    db = get_db(LIBRARY_DB)
    created = 0
    for t in tracks:
        db.execute(
            """
            INSERT INTO external_tracks (source, external_id, isrc, title, artist, album, url_audio, url_cover, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'indexed')
            """,
            ("spotify", t.get("id"), t.get("isrc"), t.get("title"), t.get("artist"), t.get("album"), None, t.get("cover"))
        )
        created += 1
    db.commit()
    return {"indexed": created}

@router.post("/itunes/library/import")
async def import_itunes_library_endpoint(body: ITunesImportRequest):
    count = import_itunes_library(Path(body.library_xml_path), copy_files=body.copy_files, library_audio=LIBRARY_AUDIO)
    return {"imported_files": count}

@router.post("/bandcamp/collection/import")
async def import_bandcamp_collection(body: BandcampImportRequest):
    links = parse_bandcamp_links(body.links_text or "")
    if not links:
        raise HTTPException(status_code=400, detail="No links provided")
    db = get_db(LIBRARY_DB)
    for url in links:
        db.execute(
            "INSERT INTO download_jobs (url, dest_path, status, created_at) VALUES (?, ?, 'queued', datetime('now'))",
            (url, None)
        )
    db.commit()
    return {"queued": len(links)}

@router.post("/downloads/queue")
async def queue_downloads(body: DownloadEnqueueRequest, background_tasks: BackgroundTasks):
    subdir = body.subdir or ""
    dest_base = (LIBRARY_AUDIO / subdir) if subdir else LIBRARY_AUDIO
    dest_base.mkdir(parents=True, exist_ok=True)
    enqueued = enqueue_downloads(body.urls, dest_base, LIBRARY_DB)
    return {"queued": enqueued}

class MBQuery(BaseModel):
    artist: Optional[str] = None
    album: Optional[str] = None
    title: Optional[str] = None

@router.post("/musicbrainz/search")
async def musicbrainz_search(body: MBQuery):
    return search_musicbrainz_release(artist=body.artist, album=body.album, title=body.title)

class DiscogsQuery(BaseModel):
    query: str
    token: Optional[str] = None

@router.post("/discogs/search")
async def discogs_search(body: DiscogsQuery):
    return search_discogs_release(query=body.query, token=body.token)

class SoundCloudQuery(BaseModel):
    url: str

@router.post("/soundcloud/resolve")
async def soundcloud_resolve(body: SoundCloudQuery):
    return {"tracks": resolve_soundcloud_tracks(body.url)}

class LocalScanRequest(BaseModel):
    folder: str
    copy: bool = False

@router.post("/local/scan")
async def local_scan(body: LocalScanRequest):
    count = scan_local_folder(Path(body.folder), LIBRARY_AUDIO, copy=body.copy)
    return {"indexed": count}

class MetadataQualityRequest(BaseModel):
    artist: Optional[str] = None
    album: Optional[str] = None
    title: Optional[str] = None
    discogs_token: Optional[str] = None
    path_audio: Optional[str] = None  # local path to associate candidates

@router.post("/metadata/quality")
async def metadata_quality(body: MetadataQualityRequest):
    candidates = aggregate_metadata(body.artist, body.album, body.title, discogs_token=body.discogs_token)
    temp_ref = None
    if body.path_audio:
        temp_ref = derive_temp_ref(body.path_audio)
        persist_candidates(temp_ref, candidates)
        # replace candidates with persisted (including IDs)
        candidates = fetch_candidates_by_temp_ref(temp_ref)
    best = choose_best(candidates)
    return {"temp_ref": temp_ref, "best": best, "candidates": candidates}

class MetadataApplyRequest(BaseModel):
    candidate_id: int
    track_id: int

@router.post("/metadata/apply")
async def metadata_apply(body: MetadataApplyRequest):
    row = apply_candidate(body.candidate_id, body.track_id)
    if not row:
        raise HTTPException(status_code=404, detail="Candidate or Track not found")
    return {
        "track": {
            "id": row[0],
            "title": row[1],
            "artist": row[2],
            "album": row[3],
            "year": row[4],
            "duration_ms": row[5],
            "path_cover": row[6]
        }
    }

@router.get("/metadata/attribution/{track_id}")
async def metadata_attribution(track_id: int):
    return {"attribution": get_attribution(track_id)}

class MetadataRevertRequest(BaseModel):
    track_id: int
    field_name: str

@router.post("/metadata/revert")
async def metadata_revert(body: MetadataRevertRequest):
    ok = revert_field(body.track_id, body.field_name)
    if not ok:
        raise HTTPException(status_code=404, detail="Nothing to revert")
    return {"status": "reverted", "attribution": get_attribution(body.track_id)}

@router.post("/metadata/recalc-confidence/{track_id}")
async def metadata_recalc_confidence(track_id: int):
    ok = recalc_confidence(track_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"status": "recalculated", "attribution": get_attribution(track_id)}

class BulkApplyItem(BaseModel):
    candidate_id: int
    track_id: int

class BulkApplyRequest(BaseModel):
    items: List[BulkApplyItem]

@router.post("/metadata/apply/bulk")
async def metadata_apply_bulk(body: BulkApplyRequest):
    applied = []
    for item in body.items:
        row = apply_candidate(item.candidate_id, item.track_id)
        if row:
            applied.append({"track_id": item.track_id, "candidate_id": item.candidate_id})
    return {"applied": applied}

@router.get("/metadata/diff/{track_id}")
async def metadata_diff(track_id: int, temp_ref: Optional[str] = None):
    # Current track
    db = get_db(LIBRARY_DB)
    t = db.execute("SELECT id, title, artist, album, year, duration_ms, path_cover FROM tracks WHERE id=?", (track_id,)).fetchone()
    if not t:
        raise HTTPException(status_code=404, detail="Track not found")
    current = {
        "id": t[0], "title": t[1], "artist": t[2], "album": t[3], "year": t[4], "duration_ms": t[5], "path_cover": t[6]
    }
    attribution = get_attribution(track_id)
    candidates = []
    if temp_ref:
        candidates = fetch_candidates_by_temp_ref(temp_ref)
    return {"current": current, "attribution": attribution, "candidates": candidates}

# --- Server-Sent Events (SSE) for backend -> frontend notifications ---
async def sse_event_stream():
    while True:
        payload = await event_queue.get()
        yield f"data: {payload}\n\n"

@router.get("/events/stream")
async def events_stream():
    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")

class EmitEvent(BaseModel):
    type: str  # upload_complete | download_finished | info
    message: Optional[str] = None
    track_id: Optional[int] = None

@router.post("/events/emit")
async def events_emit(body: EmitEvent):
    # Minimal validation
    if body.type not in {"upload_complete", "download_finished", "info"}:
        raise HTTPException(status_code=400, detail="Invalid event type")
    payload = {"type": body.type, "message": body.message, "track_id": body.track_id}
    await event_queue.put(__import__("json").dumps(payload))
    return {"status": "queued"}

class ArtworkCreate(BaseModel):
    cover_url: Optional[str] = None
    source: str

@router.get("/tracks/{track_id}/artworks")
async def track_artworks(track_id: int):
    return {"artworks": list_artworks(track_id)}

@router.post("/tracks/{track_id}/artworks")
async def track_artworks_add(track_id: int, body: ArtworkCreate):
    try:
        art = add_artwork(track_id, body.cover_url, body.source)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"artwork": art, "artworks": list_artworks(track_id)}

@router.post("/tracks/{track_id}/artworks/{artwork_id}/primary")
async def track_artworks_set_primary(track_id: int, artwork_id: int):
    ok = set_primary_artwork(artwork_id, track_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return {"status": "primary_set", "artworks": list_artworks(track_id)}

@router.delete("/tracks/{track_id}/artworks/{artwork_id}")
async def track_artworks_delete(track_id: int, artwork_id: int):
    ok = delete_artwork(artwork_id, track_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return {"status": "deleted", "artworks": list_artworks(track_id)}

class RelationCreate(BaseModel):
    related_track_id: int
    relation_type: str  # remix | edit | alternate_version | sample_of | part_of_release

@router.get("/tracks/{track_id}/relations")
async def track_relations(track_id: int):
    return {"relations": list_relations(track_id)}

@router.post("/tracks/{track_id}/relations")
async def track_relations_add(track_id: int, body: RelationCreate):
    try:
        rel = add_relation(track_id, body.related_track_id, body.relation_type)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return {"relation": rel, "relations": list_relations(track_id)}

@router.delete("/tracks/{track_id}/relations/{relation_id}")
async def track_relations_delete(track_id: int, relation_id: int):
    ok = delete_relation(track_id, relation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Relation not found")
    return {"status": "deleted", "relations": list_relations(track_id)}

class SampleCreate(BaseModel):
    start_ms: int
    end_ms: int
    pad_index: int
    path_audio: Optional[str] = None  # future: generated slice path

@router.get("/tracks/{track_id}/samples")
async def track_samples(track_id: int):
    return {"samples": list_samples(track_id)}

@router.post("/tracks/{track_id}/samples")
async def track_samples_add(track_id: int, body: SampleCreate):
    try:
        sample = add_sample(track_id, body.start_ms, body.end_ms, body.pad_index, body.path_audio or "")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return {"sample": sample, "samples": list_samples(track_id)}

@router.delete("/tracks/{track_id}/samples/{sample_id}")
async def track_samples_delete(track_id: int, sample_id: int):
    ok = delete_sample(track_id, sample_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Sample not found")
    return {"status": "deleted", "samples": list_samples(track_id)}
