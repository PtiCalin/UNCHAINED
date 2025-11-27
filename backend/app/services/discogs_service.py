import requests
from typing import Optional
from .cache_service import get_cached, set_cached

BASE = "https://api.discogs.com/database/search"
UA = {"User-Agent": "UNCHAINED/0.1"}

def search_discogs_release(query: str, token: Optional[str] = None):
    cache_key = f"discogs:{query}:{token or 'no-token'}"
    cached = get_cached(cache_key)
    if cached:
        data = cached
    else:
        params = {"q": query}
        headers = dict(UA)
        if token:
            headers["Authorization"] = f"Discogs token={token}"
        resp = requests.get(BASE, params=params, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        set_cached(cache_key, "discogs", data)
    results = []
    for i in data.get("results", [])[:20]:
        results.append({
            "id": i.get("id"),
            "title": i.get("title"),
            "year": i.get("year"),
            "type": i.get("type"),
            "cover": i.get("cover_image"),
        })
    return {"results": results}
