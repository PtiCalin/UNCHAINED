import sqlite3
from pathlib import Path

def init_db(db_path: Path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            artist TEXT,
            album TEXT,
            year INTEGER,
            duration_ms INTEGER,
            path_audio TEXT,
            path_cover TEXT,
            path_metadata TEXT,
            isrc TEXT,
            genre TEXT,
            subgenre TEXT,
            track_number INTEGER,
            disc_number INTEGER,
            import_date TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def get_db(db_path: Path) -> sqlite3.Connection:
    return sqlite3.connect(db_path)
