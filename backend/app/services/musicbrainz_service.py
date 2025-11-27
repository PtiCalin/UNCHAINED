import requests
from typing import Optional
from .cache_service import get_cached, set_cached

BASE = "https://musicbrainz.org/ws/2"
HEADERS = {"User-Agent": "UNCHAINED/0.1 ( https://github.com/PtiCalin/UNCHAINED )"}


def search_musicbrainz_release(artist: Optional[str], album: Optional[str], title: Optional[str]):
    query_parts = []
    if artist:
        query_parts.append(f"artist:{artist}")
    if album:
        query_parts.append(f"release:{album}")
    if title:
        query_parts.append(f"recording:{title}")
    query = " ".join(query_parts) or title or album or artist or ""
    cache_key = f"musicbrainz:{query}"
    cached = get_cached(cache_key)
    if cached:
        data = cached
    else:
        resp = requests.get(f"{BASE}/recording", params={"query": query, "fmt": "json"}, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        set_cached(cache_key, "musicbrainz", data)
    # Trim large payload
    recordings = []
    for r in data.get("recordings", [])[:20]:
        artists = ", ".join(a.get("name") for a in r.get("artist-credit", []) if isinstance(a, dict) and a.get("name"))
        recordings.append({
            "id": r.get("id"),
            "title": r.get("title"),
            "artist": artists,
            "length": r.get("length"),
        })
    return {"recordings": recordings}
