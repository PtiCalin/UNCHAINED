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
    # Multiple artworks per track
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS track_artworks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            path_cover TEXT,
            source TEXT,
            is_primary INTEGER DEFAULT 0,
            created_at TEXT
        )
        """
    )
    # Relations between tracks (remix/edit/version/sample/release grouping)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS track_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            related_track_id INTEGER,
            relation_type TEXT,
            created_at TEXT
        )
        """
    )
    # Samples table (audio slices derived from a track) if not exists
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            start_ms INTEGER,
            end_ms INTEGER,
            path_audio TEXT,
            pad_index INTEGER,
            created_at TEXT
        )
        """
    )
    # DJ analysis results per track (computed features)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            bpm REAL,
            key TEXT,
            waveform_path TEXT,
            beatgrid_json TEXT,
            energy REAL,
            analyzer TEXT,
            analyzed_at TEXT
        )
        """
    )
    # Cue points per track
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS cue_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            label TEXT,
            position_ms INTEGER,
            color TEXT,
            hot_index INTEGER,
            created_at TEXT,
            updated_at TEXT
        )
        """
    )
    # Loops per track
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS loops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            start_ms INTEGER,
            end_ms INTEGER,
            length_beats REAL,
            quantized INTEGER,
            active INTEGER,
            created_at TEXT,
            updated_at TEXT
        )
        """
    )
    # Deck runtime states (ephemeral saves)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS deck_states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id TEXT,
            track_id INTEGER,
            position_ms INTEGER,
            tempo REAL,
            pitch REAL,
            key_shift INTEGER,
            slip_mode INTEGER,
            created_at TEXT
        )
        """
    )
    # Recordings registry
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS recordings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path_audio TEXT,
            started_at TEXT,
            finished_at TEXT,
            duration_ms INTEGER,
            notes TEXT
        )
        """
    )
    # Effect definitions (library of available effects)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS effects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            category TEXT,
            description TEXT,
            default_params_json TEXT,
            created_at TEXT
        )
        """
    )
    # FX presets (saved effect chains with custom parameters)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS fx_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            category TEXT,
            effects_json TEXT,
            is_factory INTEGER DEFAULT 0,
            created_at TEXT
        )
        """
    )
    # Effect chains (active effects per deck)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS effect_chains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id TEXT,
            slot INTEGER,
            effect_id INTEGER,
            params_json TEXT,
            enabled INTEGER DEFAULT 1,
            wet_dry REAL DEFAULT 0.5,
            created_at TEXT
        )
        """
    )
    # FX usage history (deck applications)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS fx_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id TEXT,
            preset_id INTEGER,
            track_id INTEGER,
            applied_at TEXT
        )
        """
    )
    # Track embeddings (audio feature vectors for similarity and clustering)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS track_embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER UNIQUE,
            embedding_vector TEXT,
            model_version TEXT,
            dimensionality INTEGER,
            computed_at TEXT
        )
        """
    )
    # Track clusters (grouping tracks by similarity)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS track_clusters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER,
            cluster_id INTEGER,
            algorithm TEXT,
            distance_to_centroid REAL,
            computed_at TEXT
        )
        """
    )
    # Library statistics (aggregate metrics over time)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS library_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT,
            metric_value TEXT,
            computed_at TEXT
        )
        """
    )
    # Track similarities (precomputed pairwise similarity scores)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS track_similarities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id_a INTEGER,
            track_id_b INTEGER,
            similarity_score REAL,
            algorithm TEXT,
            computed_at TEXT,
            UNIQUE(track_id_a, track_id_b, algorithm)
        )
        """
    )
    conn.commit()
    conn.close()


def get_db(db_path: Path) -> sqlite3.Connection:
    return sqlite3.connect(db_path)
