from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.tracks import router as tracks_router
from .api.sources import router as sources_router

app = FastAPI(title="UNCHAINED API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(tracks_router, prefix="/tracks", tags=["tracks"])
app.include_router(sources_router, prefix="/sources", tags=["sources"])
