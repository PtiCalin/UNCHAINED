from typing import List, Dict, Any, Optional
from pathlib import Path
from .musicbrainz_service import search_musicbrainz_release
from .discogs_service import search_discogs_release
from ..utils.db_utils import get_db
from .cover_service import download_cover_if_needed
from .metadata_provenance_service import record_field_attribution
import hashlib

# Simple normalization helpers

def _norm(s: Optional[str]) -> Optional[str]:
    if not s:
        return s
    return " ".join(s.strip().split())


def _score(candidate: Dict[str, Any]) -> float:
    score = 0.0
    weights = {
        'title': 2.0,
        'artist': 2.0,
        'album': 1.5,
        'year': 1.0,
        'cover_url': 1.0,
        'length_ms': 1.0,
    }
    for field, w in weights.items():
        if candidate.get(field):
            score += w
    return score


def aggregate_metadata(artist: Optional[str], album: Optional[str], title: Optional[str], discogs_token: Optional[str] = None) -> List[Dict[str, Any]]:
    mb = search_musicbrainz_release(artist=artist, album=album, title=title)
    discogs_query = " ".join(x for x in [artist, album, title] if x) or (title or artist or album or "")
    dg = search_discogs_release(query=discogs_query, token=discogs_token)

    candidates: List[Dict[str, Any]] = []

    for r in mb.get('recordings', []):
        cand = {
            'source': 'musicbrainz',
            'title': _norm(r.get('title')),
            'artist': _norm(r.get('artist')),
            'album': _norm(album),
            'year': None,
            'length_ms': r.get('length'),
            'cover_url': None,
        }
        cand['score'] = _score(cand)
        candidates.append(cand)

    for r in dg.get('results', []):
        cand = {
            'source': 'discogs',
            'title': _norm(r.get('title')),
            'artist': _norm(artist),
            'album': _norm(r.get('title')) if r.get('type') == 'release' else _norm(album),
            'year': r.get('year'),
            'length_ms': None,
            'cover_url': r.get('cover'),
        }
        cand['score'] = _score(cand)
        candidates.append(cand)

    # Sort by score desc
    candidates.sort(key=lambda x: x['score'], reverse=True)
    return candidates


def persist_candidates(temp_ref: str, candidates: List[Dict[str, Any]]):
    db = get_db(Path('library/db/library.sqlite').resolve())
    for c in candidates:
        db.execute(
            """
            INSERT INTO metadata_candidates (temp_track_ref, source, title, artist, album, year, length_ms, cover_url, score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (
                temp_ref,
                c.get('source'), c.get('title'), c.get('artist'), c.get('album'), c.get('year'), c.get('length_ms'), c.get('cover_url'), c.get('score')
            )
        )
    db.commit()


def fetch_candidates_by_temp_ref(temp_ref: str) -> List[Dict[str, Any]]:
    db = get_db(Path('library/db/library.sqlite').resolve())
    rows = db.execute(
        "SELECT id, source, title, artist, album, year, length_ms, cover_url, score, applied FROM metadata_candidates WHERE temp_track_ref=? ORDER BY score DESC",
        (temp_ref,)
    ).fetchall()
    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append({
            'id': r[0], 'source': r[1], 'title': r[2], 'artist': r[3], 'album': r[4], 'year': r[5], 'length_ms': r[6], 'cover_url': r[7], 'score': r[8], 'applied': r[9]
        })
    return out


def derive_temp_ref(path_audio: str) -> str:
    return hashlib.sha1(path_audio.encode()).hexdigest()[:16]


def choose_best(candidates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    return candidates[0] if candidates else None


def apply_candidate(candidate_id: int, track_id: int):
    db = get_db(Path('library/db/library.sqlite').resolve())
    c_row = db.execute("SELECT source, title, artist, album, year, length_ms, cover_url, score FROM metadata_candidates WHERE id=?", (candidate_id,)).fetchone()
    if not c_row:
        return None
    cand = {
        'source': c_row[0], 'title': c_row[1], 'artist': c_row[2], 'album': c_row[3], 'year': c_row[4], 'length_ms': c_row[5], 'cover_url': c_row[6], 'score': c_row[7]
    }
    t_row = db.execute("SELECT id, title, artist, album, year, duration_ms, path_cover FROM tracks WHERE id=?", (track_id,)).fetchone()
    if not t_row:
        return None
    # Merge only missing fields
    new_title = t_row[1] or cand.get('title')
    new_artist = t_row[2] or cand.get('artist')
    new_album = t_row[3] or cand.get('album')
    new_year = t_row[4] or cand.get('year')
    new_duration = t_row[5] or cand.get('length_ms')
    path_cover = t_row[6]
    if not path_cover and cand.get('cover_url'):
        path_cover = download_cover_if_needed(track_id, cand.get('cover_url'))
    db.execute(
        "UPDATE tracks SET title=?, artist=?, album=?, year=?, duration_ms=?, path_cover=? WHERE id=?",
        (new_title, new_artist, new_album, new_year, new_duration, path_cover, track_id)
    )
    db.execute("UPDATE metadata_candidates SET applied=1 WHERE id=?", (candidate_id,))
    db.commit()
    # Record attribution only for fields changed from None to new value
    # Retrieve updated track row
    updated = {
        'title': new_title,
        'artist': new_artist,
        'album': new_album,
        'year': new_year,
        'duration_ms': new_duration,
        'path_cover': path_cover
    }
    original = {
        'title': t_row[1],
        'artist': t_row[2],
        'album': t_row[3],
        'year': t_row[4],
        'duration_ms': t_row[5],
        'path_cover': t_row[6]
    }
    for field, value in updated.items():
        if original.get(field) in (None, '') and value:
            record_field_attribution(track_id, field, value, cand.get('source'), candidate_id, cand.get('score') or 0.0)
    return db.execute("SELECT id, title, artist, album, year, duration_ms, path_cover FROM tracks WHERE id=?", (track_id,)).fetchone()
