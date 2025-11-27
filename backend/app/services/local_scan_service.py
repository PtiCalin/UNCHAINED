from pathlib import Path
from ..utils.db_utils import get_db

# Index or copy local files from a folder into the library

def scan_local_folder(folder: Path, library_audio: Path, copy: bool = False) -> int:
    if not folder.exists():
        return 0
    db = get_db(Path('library/db/library.sqlite').resolve())
    count = 0
    for p in folder.rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.mp3', '.flac', '.wav', '.m4a', '.aac'}:
            dest_path = p
            if copy:
                dest_path = library_audio / p.name
                try:
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    if not dest_path.exists():
                        from shutil import copy2
                        copy2(p, dest_path)
                except Exception:
                    continue
            db.execute(
                "INSERT INTO tracks (title, artist, album, path_audio, import_date) VALUES (?, ?, ?, ?, datetime('now'))",
                (p.stem, None, None, str(dest_path))
            )
            count += 1
    db.commit()
    return count
