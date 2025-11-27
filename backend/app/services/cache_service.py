from pathlib import Path
import time
import json
from typing import Optional
from ..utils.db_utils import get_db

DB_PATH = Path('library/db/library.sqlite').resolve()
TTL_SECONDS_DEFAULT = 3600 * 24  # 24h


def _now() -> int:
    return int(time.time())


def get_cached(cache_key: str, ttl_seconds: int = TTL_SECONDS_DEFAULT) -> Optional[dict]:
    db = get_db(DB_PATH)
    row = db.execute("SELECT payload, created_at FROM external_cache WHERE cache_key=?", (cache_key,)).fetchone()
    if not row:
        return None
    payload, created_at = row
    if _now() - int(created_at) > ttl_seconds:
        return None
    try:
        return json.loads(payload)
    except Exception:
        return None


def set_cached(cache_key: str, source: str, payload: dict):
    db = get_db(DB_PATH)
    db.execute(
        "INSERT OR REPLACE INTO external_cache (cache_key, source, payload, created_at) VALUES (?, ?, ?, ?)",
        (cache_key, source, json.dumps(payload), _now())
    )
    db.commit()
