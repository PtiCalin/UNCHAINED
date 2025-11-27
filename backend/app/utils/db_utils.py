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
            mapped_track_id INTEGER,
            confidence REAL
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
    # Metadata candidates aggregated from multi-source queries before finalizing import
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS metadata_candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temp_track_ref TEXT, -- arbitrary key (e.g., local filename hash) to group candidates
            source TEXT,
            title TEXT,
            artist TEXT,
            album TEXT,
            year TEXT,
            length_ms INTEGER,
            cover_url TEXT,
            score REAL,
            created_at TEXT
        )
        """
    )
    # External metadata cache with TTL (epoch seconds)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS external_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key TEXT UNIQUE,
            source TEXT,
            payload TEXT,
            created_at INTEGER
        )
        """
    )
    # Attempt to add applied column if missing (best-effort)
    try:
        c.execute("ALTER TABLE metadata_candidates ADD COLUMN applied INTEGER DEFAULT 0")
    except Exception:
        pass
    # Field-level provenance for applied metadata
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS metadata_attribution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            field_name TEXT,
            value TEXT,
            source TEXT,
            candidate_id INTEGER,
            confidence REAL,
            applied_at TEXT,
            reverted INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()
    conn.close()


def get_db(db_path: Path) -> sqlite3.Connection:
    return sqlite3.connect(db_path)
