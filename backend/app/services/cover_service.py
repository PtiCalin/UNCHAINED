from pathlib import Path
import requests

COVERS_DIR = Path('library/covers').resolve()
COVERS_DIR.mkdir(parents=True, exist_ok=True)


def download_cover_if_needed(track_id: int, url: str) -> str:
    if not url:
        return ''
    ext = 'jpg'
    if url.lower().endswith('.png'):
        ext = 'png'
    dest = COVERS_DIR / f"{track_id}.{ext}"
    if dest.exists():
        return str(dest)
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        with open(dest, 'wb') as f:
            f.write(r.content)
        return str(dest)
    except Exception:
        return ''
