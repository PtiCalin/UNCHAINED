"""
Analytics service for computing embeddings, clustering, similarity, and library statistics.
"""
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
import sqlite3
import json
from datetime import datetime
import numpy as np

# ML imports (will be installed)
try:
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    # Graceful fallback if ML deps not installed yet
    KMeans = None
    DBSCAN = None
    PCA = None
    StandardScaler = None
    cosine_similarity = None


class AnalyticsService:
    def __init__(self, db_path: Path):
        self.db_path = db_path

    def _get_conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    # ========================
    # EMBEDDINGS
    # ========================

    def compute_embeddings(
        self,
        track_ids: Optional[List[int]] = None,
        model_version: str = "v1",
        force_recompute: bool = False
    ) -> Dict[str, Any]:
        """
        Compute audio feature embeddings for tracks.
        For now, uses metadata-based features (placeholder).
        Future: integrate Essentia or librosa for acoustic features.
        """
        conn = self._get_conn()
        c = conn.cursor()

        # If no track_ids provided, compute for all tracks without embeddings
        if track_ids is None:
            if force_recompute:
                c.execute("SELECT id FROM tracks")
            else:
                c.execute(
                    "SELECT id FROM tracks WHERE id NOT IN (SELECT track_id FROM track_embeddings WHERE model_version = ?)",
                    (model_version,)
                )
            track_ids = [row[0] for row in c.fetchall()]

        computed_count = 0
        for track_id in track_ids:
            # Fetch track metadata
            c.execute("SELECT title, artist, album, genre, duration_ms, year FROM tracks WHERE id = ?", (track_id,))
            row = c.fetchone()
            if not row:
                continue

            title, artist, album, genre, duration_ms, year = row

            # Placeholder: simple feature vector from metadata
            # Future: extract acoustic features (MFCCs, chroma, spectral)
            embedding = self._extract_features(title, artist, album, genre, duration_ms, year)
            embedding_json = json.dumps(embedding)

            # Store or update embedding
            c.execute(
                """
                INSERT OR REPLACE INTO track_embeddings (track_id, embedding_vector, model_version, dimensionality, computed_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (track_id, embedding_json, model_version, len(embedding), datetime.utcnow().isoformat())
            )
            computed_count += 1

        conn.commit()
        conn.close()
        return {"computed": computed_count, "model_version": model_version}

    def compute_acoustic_features(self, track_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Stub for acoustic feature extraction using librosa (if installed)."""
        try:
            import librosa  # type: ignore
        except Exception:
            return {"error": "librosa not installed"}
        conn = self._get_conn()
        c = conn.cursor()
        if track_ids is None:
            c.execute("SELECT id, path_audio FROM tracks WHERE path_audio IS NOT NULL")
            rows = c.fetchall()
        else:
            placeholders = ",".join("?" * len(track_ids))
            c.execute(f"SELECT id, path_audio FROM tracks WHERE id IN ({placeholders}) AND path_audio IS NOT NULL", track_ids)
            rows = c.fetchall()
        processed = 0
        for tid, path_audio in rows:
            try:
                y, sr = librosa.load(path_audio, sr=22050, mono=True, duration=60)
                mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist()
                chroma = librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1).tolist()
                spectral_centroid = [float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())]
                feat_vec = mfcc + chroma + spectral_centroid
                c.execute(
                    """
                    INSERT OR REPLACE INTO track_embeddings (track_id, embedding_vector, model_version, dimensionality, computed_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (tid, json.dumps(feat_vec), "acoustic_v1", len(feat_vec), datetime.utcnow().isoformat())
                )
                processed += 1
            except Exception:
                continue
        conn.commit()
        conn.close()
        return {"processed": processed, "model_version": "acoustic_v1"}

    def _extract_features(self, title, artist, album, genre, duration_ms, year) -> List[float]:
        """
        Placeholder feature extraction from metadata.
        Future: integrate audio analysis (Essentia, librosa).
        """
        features = []
        # Duration (normalized to 0-1, assuming max 10 minutes)
        features.append(min(1.0, (duration_ms or 0) / 600000))
        # Year (normalized to 0-1, assuming range 1950-2030)
        features.append(min(1.0, max(0.0, ((year or 2000) - 1950) / 80)))
        # Genre encoding (placeholder: hash to 0-1)
        features.append((hash(genre or "") % 100) / 100.0)
        # Title/artist/album embeddings (placeholder: length-based)
        features.append(min(1.0, len(title or "") / 50))
        features.append(min(1.0, len(artist or "") / 50))
        features.append(min(1.0, len(album or "") / 50))
        return features

    def get_embeddings(self, track_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Retrieve stored embeddings for tracks."""
        conn = self._get_conn()
        c = conn.cursor()

        if track_ids:
            placeholders = ",".join("?" * len(track_ids))
            c.execute(
                f"SELECT track_id, embedding_vector, model_version, dimensionality, computed_at FROM track_embeddings WHERE track_id IN ({placeholders})",
                track_ids
            )
        else:
            c.execute("SELECT track_id, embedding_vector, model_version, dimensionality, computed_at FROM track_embeddings")

        results = []
        for row in c.fetchall():
            results.append({
                "track_id": row[0],
                "embedding": json.loads(row[1]),
                "model_version": row[2],
                "dimensionality": row[3],
                "computed_at": row[4]
            })

        conn.close()
        return results

    # ========================
    # CLUSTERING
    # ========================

    def cluster_tracks(
        self,
        algorithm: str = "kmeans",
        n_clusters: int = 5,
        force_recompute: bool = False
    ) -> Dict[str, Any]:
        """
        Cluster tracks based on embeddings.
        Algorithms: 'kmeans', 'dbscan'.
        """
        if KMeans is None or DBSCAN is None:
            return {"error": "ML dependencies not installed. Install scikit-learn."}

        conn = self._get_conn()
        c = conn.cursor()

        # Fetch all embeddings
        c.execute("SELECT track_id, embedding_vector FROM track_embeddings")
        rows = c.fetchall()
        if not rows:
            conn.close()
            return {"error": "No embeddings found. Compute embeddings first."}

        track_ids = [row[0] for row in rows]
        embeddings = np.array([json.loads(row[1]) for row in rows])

        # Normalize embeddings
        scaler = StandardScaler()
        embeddings_scaled = scaler.fit_transform(embeddings)

        # Cluster
        if algorithm == "kmeans":
            model = KMeans(n_clusters=n_clusters, random_state=42)
            labels = model.fit_predict(embeddings_scaled)
            distances = np.min(model.transform(embeddings_scaled), axis=1)
        elif algorithm == "dbscan":
            model = DBSCAN(eps=0.5, min_samples=2)
            labels = model.fit_predict(embeddings_scaled)
            distances = [0.0] * len(labels)  # DBSCAN doesn't provide distances
        else:
            conn.close()
            return {"error": f"Unknown algorithm: {algorithm}"}

        # Store clusters
        timestamp = datetime.utcnow().isoformat()
        for track_id, cluster_id, distance in zip(track_ids, labels, distances):
            c.execute(
                """
                INSERT INTO track_clusters (track_id, cluster_id, algorithm, distance_to_centroid, computed_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (track_id, int(cluster_id), algorithm, float(distance), timestamp)
            )

        conn.commit()
        conn.close()
        return {"algorithm": algorithm, "n_clusters": len(set(labels)), "tracks_clustered": len(track_ids)}

    def get_clusters(self, algorithm: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve cluster assignments for tracks."""
        conn = self._get_conn()
        c = conn.cursor()

        if algorithm:
            c.execute(
                "SELECT track_id, cluster_id, algorithm, distance_to_centroid, computed_at FROM track_clusters WHERE algorithm = ? ORDER BY cluster_id",
                (algorithm,)
            )
        else:
            c.execute("SELECT track_id, cluster_id, algorithm, distance_to_centroid, computed_at FROM track_clusters ORDER BY cluster_id")

        results = []
        for row in c.fetchall():
            results.append({
                "track_id": row[0],
                "cluster_id": row[1],
                "algorithm": row[2],
                "distance_to_centroid": row[3],
                "computed_at": row[4]
            })

        conn.close()
        return results

    # ========================
    # SIMILARITY
    # ========================

    def compute_similarity(self, track_id: int, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Compute similarity between a track and all other tracks.
        Returns top N most similar tracks.
        """
        if cosine_similarity is None:
            return []

        conn = self._get_conn()
        c = conn.cursor()

        # Get target embedding
        c.execute("SELECT embedding_vector FROM track_embeddings WHERE track_id = ?", (track_id,))
        row = c.fetchone()
        if not row:
            conn.close()
            return []

        target_embedding = np.array(json.loads(row[0])).reshape(1, -1)

        # Get all other embeddings
        c.execute("SELECT track_id, embedding_vector FROM track_embeddings WHERE track_id != ?", (track_id,))
        rows = c.fetchall()
        if not rows:
            conn.close()
            return []

        other_ids = [row[0] for row in rows]
        other_embeddings = np.array([json.loads(row[1]) for row in rows])

        # Compute cosine similarity
        similarities = cosine_similarity(target_embedding, other_embeddings)[0]

        # Sort and get top N
        top_indices = np.argsort(similarities)[-top_n:][::-1]
        results = []
        for idx in top_indices:
            results.append({
                "track_id": other_ids[idx],
                "similarity_score": float(similarities[idx])
            })

        conn.close()
        return results

    # ========================
    # LIBRARY STATS
    # ========================

    def compute_library_stats(self) -> Dict[str, Any]:
        """
        Compute and store aggregate library statistics.
        """
        conn = self._get_conn()
        c = conn.cursor()

        stats = {}
        timestamp = datetime.utcnow().isoformat()

        # Total tracks
        c.execute("SELECT COUNT(*) FROM tracks")
        stats["total_tracks"] = c.fetchone()[0]

        # Total duration
        c.execute("SELECT SUM(duration_ms) FROM tracks")
        total_ms = c.fetchone()[0] or 0
        stats["total_duration_hours"] = round(total_ms / 3600000, 2)

        # Genre distribution
        c.execute("SELECT genre, COUNT(*) FROM tracks WHERE genre IS NOT NULL GROUP BY genre ORDER BY COUNT(*) DESC LIMIT 10")
        stats["top_genres"] = [{"genre": row[0], "count": row[1]} for row in c.fetchall()]

        # Year distribution
        c.execute("SELECT year, COUNT(*) FROM tracks WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC LIMIT 10")
        stats["tracks_by_year"] = [{"year": row[0], "count": row[1]} for row in c.fetchall()]

        # Average BPM (if analysis_results available)
        c.execute("SELECT AVG(bpm) FROM analysis_results WHERE bpm IS NOT NULL")
        avg_bpm = c.fetchone()[0]
        stats["average_bpm"] = round(avg_bpm, 2) if avg_bpm else None

        # Store stats
        for metric_name, metric_value in stats.items():
            c.execute(
                "INSERT INTO library_stats (metric_name, metric_value, computed_at) VALUES (?, ?, ?)",
                (metric_name, json.dumps(metric_value), timestamp)
            )

        conn.commit()
        conn.close()
        return stats

    def get_library_stats(self, latest_only: bool = True) -> Dict[str, Any]:
        """Retrieve stored library statistics."""
        conn = self._get_conn()
        c = conn.cursor()

        if latest_only:
            # Get latest timestamp
            c.execute("SELECT MAX(computed_at) FROM library_stats")
            latest = c.fetchone()[0]
            if not latest:
                conn.close()
                return {}
            c.execute("SELECT metric_name, metric_value FROM library_stats WHERE computed_at = ?", (latest,))
        else:
            c.execute("SELECT metric_name, metric_value FROM library_stats")

        stats = {}
        for row in c.fetchall():
            stats[row[0]] = json.loads(row[1])

        conn.close()
        return stats

    # ========================
    # DIMENSIONALITY REDUCTION (for visualization)
    # ========================

    def reduce_dimensions(self, n_components: int = 2) -> List[Dict[str, Any]]:
        """
        Reduce embeddings to 2D or 3D for visualization using PCA.
        """
        if PCA is None:
            return []

        conn = self._get_conn()
        c = conn.cursor()

        c.execute("SELECT track_id, embedding_vector FROM track_embeddings")
        rows = c.fetchall()
        if not rows:
            conn.close()
            return []

        track_ids = [row[0] for row in rows]
        embeddings = np.array([json.loads(row[1]) for row in rows])

        # PCA
        pca = PCA(n_components=n_components)
        reduced = pca.fit_transform(embeddings)

        results = []
        for track_id, coords in zip(track_ids, reduced):
            results.append({
                "track_id": track_id,
                "x": float(coords[0]),
                "y": float(coords[1]),
                "z": float(coords[2]) if n_components == 3 else None
            })

        conn.close()
        return results
