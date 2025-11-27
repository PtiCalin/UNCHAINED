from pathlib import Path
import time
from ..services.download_service import run_download_worker

DB_PATH = Path('library/db/library.sqlite').resolve()


def run_forever(interval_seconds: int = 2):
    while True:
        did = run_download_worker(DB_PATH)
        if not did:
            time.sleep(interval_seconds)

if __name__ == '__main__':
    run_forever()
