from pydantic import BaseModel
from typing import Optional

class Track(BaseModel):
    id: int
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    duration_ms: Optional[int] = None
    path_audio: Optional[str] = None

class TrackCreate(BaseModel):
    path_audio: str
