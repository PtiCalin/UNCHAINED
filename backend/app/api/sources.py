from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi import BackgroundTasks
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

LIBRARY_DB = Path("library/db/library.sqlite").resolve()
LIBRARY_AUDIO = Path("library/audio").resolve()
LIBRARY_METADATA = Path("library/metadata").resolve()

router = APIRouter()
init_db(LIBRARY_DB)

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
