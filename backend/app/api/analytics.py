"""
Analytics API endpoints for embeddings, clustering, similarity, and statistics.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path

from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["analytics"])
# Use default DB path for now; refactor to use config later if needed
from backend.app.services.analytics_service import DB_PATH as DEFAULT_DB_PATH
analytics_service = AnalyticsService(DEFAULT_DB_PATH)


# ========================
# REQUEST MODELS
# ========================

class ComputeEmbeddingsRequest(BaseModel):
    track_ids: Optional[List[int]] = None
    model_version: str = "v1"
    force_recompute: bool = False


class ComputeClustersRequest(BaseModel):
    algorithm: str = "kmeans"  # 'kmeans' or 'dbscan'
    n_clusters: int = 5
    force_recompute: bool = False


# ========================
# EMBEDDINGS
# ========================

@router.post("/embeddings/compute")
def compute_embeddings(req: ComputeEmbeddingsRequest):
    """
    Compute embeddings for tracks.
    If track_ids is None, computes for all tracks without embeddings.
    """
    result = analytics_service.compute_embeddings(
        track_ids=req.track_ids,
        model_version=req.model_version,
        force_recompute=req.force_recompute
    )
    return result


@router.get("/embeddings")
def get_embeddings(track_ids: Optional[str] = None):
    """
    Retrieve embeddings for tracks.
    track_ids: comma-separated list (e.g., "1,2,3") or None for all.
    """
    if track_ids:
        ids = [int(x.strip()) for x in track_ids.split(",") if x.strip().isdigit()]
    else:
        ids = None
    
    embeddings = analytics_service.get_embeddings(track_ids=ids)
    return {"embeddings": embeddings}


@router.get("/embeddings/reduce")
def reduce_embeddings(n_components: int = 2):
    """
    Reduce embeddings to 2D or 3D for visualization.
    n_components: 2 or 3.
    """
    if n_components not in [2, 3]:
        raise HTTPException(status_code=400, detail="n_components must be 2 or 3")
    
    reduced = analytics_service.reduce_dimensions(n_components=n_components)
    return {"reduced_embeddings": reduced}


# ========================
# CLUSTERING
# ========================

@router.post("/clusters/compute")
def compute_clusters(req: ComputeClustersRequest):
    """
    Cluster tracks based on embeddings.
    Algorithms: 'kmeans', 'dbscan'.
    """
    result = analytics_service.cluster_tracks(
        algorithm=req.algorithm,
        n_clusters=req.n_clusters,
        force_recompute=req.force_recompute
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/clusters")
def get_clusters(algorithm: Optional[str] = None):
    """
    Retrieve cluster assignments for tracks.
    algorithm: filter by algorithm (e.g., 'kmeans', 'dbscan'), or None for all.
    """
    clusters = analytics_service.get_clusters(algorithm=algorithm)
    return {"clusters": clusters}


# ========================
# SIMILARITY
# ========================

@router.get("/similarity/{track_id}")
def get_similarity(track_id: int, top_n: int = 10):
    """
    Get top N most similar tracks to the given track.
    """
    similar = analytics_service.compute_similarity(track_id=track_id, top_n=top_n)
    if not similar:
        raise HTTPException(status_code=404, detail="Track not found or no embeddings available")
    return {"track_id": track_id, "similar_tracks": similar}


# ========================
# STATISTICS
# ========================

@router.post("/stats/compute")
def compute_stats():
    """
    Compute and store aggregate library statistics.
    """
    stats = analytics_service.compute_library_stats()
    return stats


@router.get("/stats")
def get_stats(latest_only: bool = True):
    """
    Retrieve library statistics.
    latest_only: if True, returns only the most recent computation.
    """
    stats = analytics_service.get_library_stats(latest_only=latest_only)
    if not stats:
        raise HTTPException(status_code=404, detail="No statistics found. Compute stats first.")
    return stats
