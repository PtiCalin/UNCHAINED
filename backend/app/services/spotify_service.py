from typing import List, Dict, Any
import re
import requests
import base64

# Note: Spotify provides metadata only. Audio download is not supported and violates ToS.
# This function indexes playlist tracks for metadata and later matching.

def _extract_playlist_id(url: str) -> str:
    m = re.search(r"playlist/([a-zA-Z0-9]+)", url)
    if m:
        return m.group(1)
    # also accept plain ID
    return url


def _get_spotify_token(client_id: str, client_secret: str) -> str:
    b64 = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {b64}"},
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def fetch_spotify_playlist_tracks(playlist_url: str, client_id: str, client_secret: str) -> List[Dict[str, Any]]:
    pid = _extract_playlist_id(playlist_url)
    token = _get_spotify_token(client_id, client_secret)
    out: List[Dict[str, Any]] = []
    url = f"https://api.spotify.com/v1/playlists/{pid}/tracks"
    headers = {"Authorization": f"Bearer {token}"}
    while url:
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code == 401:
            return []
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("items", []):
            track = item.get("track") or {}
            if not track:
                continue
            artists = ", ".join(a.get("name") for a in track.get("artists", []))
            album = (track.get("album") or {}).get("name")
            images = (track.get("album") or {}).get("images") or []
            cover = images[0]["url"] if images else None
            # ISRC
            external_ids = track.get("external_ids") or {}
            isrc = external_ids.get("isrc")
            out.append({
                "id": track.get("id"),
                "title": track.get("name"),
                "artist": artists,
                "album": album,
                "isrc": isrc,
                "cover": cover,
            })
        url = data.get("next")
    return out
