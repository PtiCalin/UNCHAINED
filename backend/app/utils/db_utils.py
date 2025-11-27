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
    # External tracks indexed from sources like Spotify/Bandcamp (metadata only)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS external_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            external_id TEXT,
            isrc TEXT,
            title TEXT,
            artist TEXT,
            album TEXT,
            url_audio TEXT,
            url_cover TEXT,
            status TEXT,
            mapped_track_id INTEGER
        )
        """
    )
    # Simple download jobs queue for authorized URLs
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS download_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            dest_path TEXT,
            status TEXT,
            error TEXT,
            created_at TEXT,
            started_at TEXT,
            finished_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def get_db(db_path: Path) -> sqlite3.Connection:
    return sqlite3.connect(db_path)
