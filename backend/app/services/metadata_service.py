from mutagen import File as MutagenFile
from pathlib import Path
from typing import Dict, Any


def extract_metadata(audio_path: Path) -> Dict[str, Any]:
    info: Dict[str, Any] = {}
    try:
        m = MutagenFile(str(audio_path))
        if not m:
            return info
        # duration
        if hasattr(m, 'info') and hasattr(m.info, 'length'):
            info['duration_ms'] = int(getattr(m.info, 'length', 0) * 1000)
        # tags (best-effort across formats)
        tags = m.tags or {}
        def get_tag(*keys):
            for k in keys:
                v = tags.get(k)
                if v:
                    if isinstance(v, (list, tuple)):
                        return str(v[0])
                    return str(v)
            return None
        info['title'] = get_tag('TIT2', 'TITLE', 'title')
        info['artist'] = get_tag('TPE1', 'ARTIST', 'artist')
        info['album'] = get_tag('TALB', 'ALBUM', 'album')
        info['year'] = get_tag('TDRC', 'YEAR', 'date')
        info['genre'] = get_tag('TCON', 'GENRE', 'genre')
    except Exception:
        # Keep minimal robustness; no logging yet
        pass
    return info
