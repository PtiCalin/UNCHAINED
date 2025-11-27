from typing import List
from pathlib import Path
import os
import requests
from ..utils.db_utils import get_db


def enqueue_downloads(urls: List[str], dest_base: Path, db_path: Path) -> int:
    db = get_db(db_path)
    enqueued = 0
    for url in urls:
        filename = url.split('/')[-1]
        dest = dest_base / filename
        db.execute(
            "INSERT INTO download_jobs (url, dest_path, status, created_at) VALUES (?, ?, 'queued', datetime('now'))",
            (url, str(dest))
        )
        enqueued += 1
    db.commit()
    return enqueued


def run_download_worker(db_path: Path):
    db = get_db(db_path)
    row = db.execute("SELECT id, url, dest_path FROM download_jobs WHERE status='queued' ORDER BY created_at LIMIT 1").fetchone()
    if not row:
        return False
    job_id, url, dest = row
    db.execute("UPDATE download_jobs SET status='running', started_at=datetime('now') WHERE id=?", (job_id,))
    db.commit()
    try:
        r = requests.get(url, stream=True, timeout=60)
        r.raise_for_status()
        os.makedirs(str(Path(dest).parent), exist_ok=True)
        with open(dest, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        db.execute("UPDATE download_jobs SET status='done', finished_at=datetime('now') WHERE id=?", (job_id,))
        db.commit()
        return True
    except Exception as e:
        db.execute("UPDATE download_jobs SET status='error', finished_at=datetime('now'), error=? WHERE id=?", (str(e), job_id))
        db.commit()
        return False
