# Analytics Backend - Data Models & API Design

## Overview
The analytics system provides ML-powered insights for the music library, including embeddings, clustering, similarity computation, and aggregate statistics.

## Data Models

### 1. `track_embeddings`
Stores computed feature vectors for each track.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `track_id` | INTEGER | Reference to tracks table (UNIQUE) |
| `embedding_vector` | TEXT | JSON array of feature values |
| `model_version` | TEXT | Version identifier (e.g., "v1") |
| `dimensionality` | INTEGER | Number of features in vector |
| `computed_at` | TEXT | ISO timestamp |

**Purpose**: Enable similarity search, clustering, and visualization.

**Future**: Integrate acoustic features from Essentia or librosa (MFCCs, chroma, spectral centroid, etc.).

---

### 2. `track_clusters`
Stores cluster assignments from unsupervised learning algorithms.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `track_id` | INTEGER | Reference to tracks table |
| `cluster_id` | INTEGER | Cluster assignment |
| `algorithm` | TEXT | Algorithm used (e.g., "kmeans", "dbscan") |
| `distance_to_centroid` | REAL | Distance metric (for kmeans) |
| `computed_at` | TEXT | ISO timestamp |

**Purpose**: Group similar tracks for playlist generation, discovery, and visualization.

---

### 3. `library_stats`
Stores aggregate metrics over time.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `metric_name` | TEXT | Metric identifier (e.g., "total_tracks") |
| `metric_value` | TEXT | JSON-encoded value |
| `computed_at` | TEXT | ISO timestamp |

**Purpose**: Track library growth, genre distribution, BPM trends, etc.

**Examples**:
- `total_tracks`: 1234
- `total_duration_hours`: 123.45
- `top_genres`: [{"genre": "Electronic", "count": 456}, ...]
- `average_bpm`: 128.5

---

### 4. `track_similarities`
Precomputed pairwise similarity scores (optional cache).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `track_id_a` | INTEGER | First track |
| `track_id_b` | INTEGER | Second track |
| `similarity_score` | REAL | Cosine similarity (0-1) |
| `algorithm` | TEXT | Algorithm used |
| `computed_at` | TEXT | ISO timestamp |
| `UNIQUE(track_id_a, track_id_b, algorithm)` | | Prevent duplicates |

**Purpose**: Speed up similarity queries for large libraries.

---

## API Endpoints

### Embeddings

#### `POST /analytics/embeddings/compute`
Compute embeddings for tracks.

**Request**:
```json
{
  "track_ids": [1, 2, 3],  // null for all tracks
  "model_version": "v1",
  "force_recompute": false
}
```

**Response**:
```json
{
  "computed": 123,
  "model_version": "v1"
}
```

---

#### `GET /analytics/embeddings?track_ids=1,2,3`
Retrieve stored embeddings.

**Response**:
```json
{
  "embeddings": [
    {
      "track_id": 1,
      "embedding": [0.1, 0.5, ...],
      "model_version": "v1",
      "dimensionality": 6,
      "computed_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

#### `GET /analytics/embeddings/reduce?n_components=2`
Reduce embeddings to 2D/3D for visualization (PCA).

**Response**:
```json
{
  "reduced_embeddings": [
    {"track_id": 1, "x": 0.5, "y": -0.2, "z": null},
    {"track_id": 2, "x": 0.3, "y": 0.8, "z": null}
  ]
}
```

---

### Clustering

#### `POST /analytics/clusters/compute`
Cluster tracks based on embeddings.

**Request**:
```json
{
  "algorithm": "kmeans",  // "kmeans" or "dbscan"
  "n_clusters": 5,
  "force_recompute": false
}
```

**Response**:
```json
{
  "algorithm": "kmeans",
  "n_clusters": 5,
  "tracks_clustered": 123
}
```

---

#### `GET /analytics/clusters?algorithm=kmeans`
Retrieve cluster assignments.

**Response**:
```json
{
  "clusters": [
    {
      "track_id": 1,
      "cluster_id": 0,
      "algorithm": "kmeans",
      "distance_to_centroid": 0.15,
      "computed_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

### Similarity

#### `GET /analytics/similarity/{track_id}?top_n=10`
Get top N most similar tracks.

**Response**:
```json
{
  "track_id": 5,
  "similar_tracks": [
    {"track_id": 12, "similarity_score": 0.95},
    {"track_id": 34, "similarity_score": 0.89}
  ]
}
```

---

### Statistics

#### `POST /analytics/stats/compute`
Compute and store library statistics.

**Response**:
```json
{
  "total_tracks": 1234,
  "total_duration_hours": 123.45,
  "top_genres": [{"genre": "Electronic", "count": 456}],
  "tracks_by_year": [{"year": 2023, "count": 100}],
  "average_bpm": 128.5
}
```

---

#### `GET /analytics/stats?latest_only=true`
Retrieve stored statistics.

**Response**:
```json
{
  "total_tracks": 1234,
  "total_duration_hours": 123.45,
  ...
}
```

---

## Service Layer (`analytics_service.py`)

### Key Methods:

1. **`compute_embeddings(track_ids, model_version, force_recompute)`**  
   Extract feature vectors from metadata (placeholder) or audio (future).

2. **`get_embeddings(track_ids)`**  
   Retrieve stored embeddings.

3. **`cluster_tracks(algorithm, n_clusters, force_recompute)`**  
   Run k-means or DBSCAN on embeddings.

4. **`get_clusters(algorithm)`**  
   Retrieve cluster assignments.

5. **`compute_similarity(track_id, top_n)`**  
   Find most similar tracks using cosine similarity.

6. **`compute_library_stats()`**  
   Aggregate metrics (total tracks, genres, BPM, etc.).

7. **`get_library_stats(latest_only)`**  
   Retrieve stored stats.

8. **`reduce_dimensions(n_components)`**  
   PCA for 2D/3D visualization.

---

## Dependencies

### Required Python Packages:
- `scikit-learn==1.5.2` (k-means, DBSCAN, PCA, cosine similarity)
- `umap-learn==0.5.6` (future: better 2D/3D projections)
- `numpy`, `scipy` (already in requirements.txt)

### Future Integrations:
- **Essentia** or **librosa** for acoustic feature extraction (MFCCs, chroma, spectral features)
- **TensorFlow/PyTorch** for deep learning embeddings (e.g., music2vec)

---

## Frontend Integration Plan

### Dashboard Sections:
1. **Library Overview**: Stats cards (total tracks, duration, genres)
2. **Embedding Visualization**: 2D/3D scatter plot (PCA/UMAP)
3. **Cluster Explorer**: Interactive cluster groups with track lists
4. **Similarity Network**: Graph visualization of related tracks
5. **Time Series**: Usage trends, imports over time

### Charting Library Options:
- **recharts** (React-friendly, simple)
- **plotly.js** (scientific, interactive)
- **nivo** (aesthetic, declarative)
- **react-force-graph** (for similarity networks)

---

## Next Steps
1. ✅ Define data models and add tables to `db_utils.py`
2. ✅ Implement `analytics_service.py` with embeddings, clustering, similarity, stats
3. ✅ Create `analytics.py` API endpoints
4. ✅ Register analytics router in `main.py`
5. ✅ Add ML dependencies to `requirements.txt`
6. ⬜ Design and implement frontend dashboard UI
7. ⬜ Integrate charting library and visualizations
8. ⬜ Test embeddings, clustering, and similarity APIs
9. ⬜ Add acoustic feature extraction (Essentia/librosa)
10. ⬜ Implement genre prediction and usage analytics

---

## Notes
- Current embeddings are **metadata-based placeholders** (duration, year, genre, title/artist/album lengths).
- **Acoustic features** (MFCCs, chroma, spectral) will be integrated in Phase 2 for better similarity and clustering.
- All ML operations are **asynchronous-friendly** and can be offloaded to background workers for large libraries.
