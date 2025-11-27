from pathlib import Path
from typing import Optional
import plistlib
import shutil

from ..utils.db_utils import get_db


def import_itunes_library(library_xml: Path, copy_files: bool, library_audio: Path) -> int:
    if not library_xml.exists():
        return 0
    with open(library_xml, 'rb') as f:
        pl = plistlib.load(f)
    tracks = pl.get('Tracks', {})
    imported = 0
    db = get_db(Path('library/db/library.sqlite').resolve())
    for tid, t in tracks.items():
        location = t.get('Location')
        name = t.get('Name')
        artist = t.get('Artist')
        album = t.get('Album')
        year = t.get('Year')
        duration_ms = int((t.get('Total Time') or 0))
        if not location:
            continue
        # iTunes URL like file://; decode path
        from urllib.parse import unquote, urlparse
        p = urlparse(location)
        if p.scheme != 'file':
            continue
        src_path = Path(unquote(p.path))
        if copy_files:
            dest = library_audio / src_path.name
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                if not dest.exists():
                    shutil.copy2(src_path, dest)
                path_audio = str(dest)
            except Exception:
                continue
        else:
            path_audio = str(src_path)
        db.execute(
            """
            INSERT INTO tracks (title, artist, album, year, duration_ms, path_audio, import_date)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (name, artist, album, year, duration_ms, path_audio)
        )
        imported += 1
    db.commit()
    return imported
